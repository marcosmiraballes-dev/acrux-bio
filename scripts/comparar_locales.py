"""
============================================
ACRUX-BIO - COMPARACIÓN INTELIGENTE DE LOCALES
Detecta duplicados y nombres similares
============================================
"""

import os
from dotenv import load_dotenv
from difflib import SequenceMatcher

load_dotenv()

SHEET_ID = os.getenv('SHEET_ID')
CREDENTIALS_FILE = 'credentials.json'

def similitud(a, b):
    """Calcular similitud entre dos strings (0 a 1)"""
    return SequenceMatcher(None, a.upper(), b.upper()).ratio()

def conectar_google_sheets():
    """Conectar a Google Sheets"""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
        
        credentials = Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=scopes
        )
        
        client = gspread.authorize(credentials)
        return client.open_by_key(SHEET_ID)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def exportar_hoja(spreadsheet, nombre_hoja):
    """Exportar hoja a lista de diccionarios"""
    try:
        worksheet = spreadsheet.worksheet(nombre_hoja)
        data = worksheet.get_all_values()
        
        if not data or len(data) < 2:
            return []
        
        headers = data[0]
        rows = data[1:]
        
        result = []
        for row in rows:
            if any(row):
                item = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        value = row[i].strip() if row[i] else None
                        item[header] = value if value else None
                result.append(item)
        
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def main():
    print("=" * 80)
    print("🔍 COMPARACIÓN INTELIGENTE DE LOCALES")
    print("=" * 80)
    
    spreadsheet = conectar_google_sheets()
    if not spreadsheet:
        return
    
    print("\n✅ Conectado a Google Sheets")
    
    # Exportar hojas
    print("\n📊 Exportando datos...")
    cat_locales = exportar_hoja(spreadsheet, 'CAT_LOCALES')
    operativo = exportar_hoja(spreadsheet, 'OPERATIVO')
    
    print(f"   ✅ CAT_LOCALES: {len(cat_locales)} registros")
    print(f"   ✅ OPERATIVO: {len(operativo)} registros")
    
    # Crear diccionario de locales existentes por plaza
    # Nota: Usar la columna correcta del Sheet
    locales_por_plaza = {}
    for row in cat_locales:
        plaza = row.get('Plaza_Nombre', '')
        # Intentar ambas columnas por si acaso
        local = row.get('Nombre_Local', '') or row.get('LOCAL', '')
        if plaza and local:
            if plaza not in locales_por_plaza:
                locales_por_plaza[plaza] = []
            locales_por_plaza[plaza].append(local)
    
    # Encontrar locales faltantes en OPERATIVO
    locales_operativo = {}
    for row in operativo:
        plaza = row.get('Plaza')
        local = row.get('Local')
        
        if not plaza or not local:
            continue
        
        plaza = str(plaza).strip()
        local = str(local).strip()
        
        if plaza not in locales_operativo:
            locales_operativo[plaza] = set()
        locales_operativo[plaza].add(local)
    
    # Analizar coincidencias
    print("\n" + "=" * 80)
    print("📋 ANÁLISIS DE COINCIDENCIAS")
    print("=" * 80)
    
    exactas = []
    similares = []
    nuevos = []
    
    for plaza in sorted(locales_operativo.keys()):
        locales_en_operativo = locales_operativo[plaza]
        locales_en_catalogo = locales_por_plaza.get(plaza, [])
        
        for local_op in sorted(locales_en_operativo):
            # Buscar coincidencia exacta (ignorando mayúsculas)
            encontrado_exacto = False
            for local_cat in locales_en_catalogo:
                if local_op.upper() == local_cat.upper():
                    exactas.append({
                        'plaza': plaza,
                        'operativo': local_op,
                        'catalogo': local_cat,
                        'accion': 'NORMALIZAR'
                    })
                    encontrado_exacto = True
                    break
            
            if encontrado_exacto:
                continue
            
            # Buscar coincidencias similares (>= 80% similitud)
            mejor_similitud = 0
            mejor_match = None
            
            for local_cat in locales_en_catalogo:
                sim = similitud(local_op, local_cat)
                if sim > mejor_similitud:
                    mejor_similitud = sim
                    mejor_match = local_cat
            
            if mejor_similitud >= 0.80:  # 80% o más de similitud
                similares.append({
                    'plaza': plaza,
                    'operativo': local_op,
                    'catalogo': mejor_match,
                    'similitud': mejor_similitud,
                    'accion': 'VERIFICAR'
                })
            else:
                nuevos.append({
                    'plaza': plaza,
                    'local': local_op,
                    'accion': 'AGREGAR'
                })
    
    # Mostrar resultados
    print(f"\n✅ COINCIDENCIAS EXACTAS (solo normalizar): {len(exactas)}")
    if exactas and len(exactas) <= 10:
        for item in exactas[:10]:
            print(f"   📌 {item['plaza']}")
            print(f"      OPERATIVO: {item['operativo']}")
            print(f"      CATÁLOGO:  {item['catalogo']}")
            print()
    
    print(f"\n⚠️  COINCIDENCIAS SIMILARES (verificar manualmente): {len(similares)}")
    if similares:
        print("\nEstos locales son MUY parecidos, probablemente son el mismo:")
        for item in similares:
            print(f"\n   📌 {item['plaza']} ({item['similitud']*100:.0f}% similar)")
            print(f"      OPERATIVO: {item['operativo']}")
            print(f"      CATÁLOGO:  {item['catalogo']}")
            print(f"      ¿Son el mismo? Normaliza nombres en OPERATIVO o CAT_LOCALES")
    
    print(f"\n\n❌ LOCALES REALMENTE NUEVOS (agregar a CAT_LOCALES): {len(nuevos)}")
    if nuevos:
        print("\nEstos NO existen en CAT_LOCALES, debes agregarlos:\n")
        
        # Agrupar por plaza
        nuevos_por_plaza = {}
        for item in nuevos:
            plaza = item['plaza']
            if plaza not in nuevos_por_plaza:
                nuevos_por_plaza[plaza] = []
            nuevos_por_plaza[plaza].append(item['local'])
        
        for plaza in sorted(nuevos_por_plaza.keys()):
            print(f"\n📍 {plaza} ({len(nuevos_por_plaza[plaza])} locales)")
            print("-" * 80)
            for local in sorted(nuevos_por_plaza[plaza]):
                print(f"   • {local}")
    
    # CSV para copiar
    if nuevos:
        print("\n" + "=" * 80)
        print("📄 CSV PARA AGREGAR A CAT_LOCALES (SOLO NUEVOS)")
        print("=" * 80)
        print("\nPlaza_Nombre,Nombre_Local")
        for plaza in sorted(nuevos_por_plaza.keys()):
            for local in sorted(nuevos_por_plaza[plaza]):
                print(f"{plaza},{local}")
    
    # Resumen
    print("\n" + "=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    print(f"\n✅ Exactas (normalizar):  {len(exactas)}")
    print(f"⚠️  Similares (verificar):  {len(similares)}")
    print(f"❌ Nuevos (agregar):       {len(nuevos)}")
    print(f"\n📌 Total analizado:       {len(exactas) + len(similares) + len(nuevos)}")
    
    print("\n" + "=" * 80)
    print("💡 PRÓXIMOS PASOS")
    print("=" * 80)
    print("\n1. EXACTAS: En OPERATIVO, normaliza los nombres para que coincidan")
    print("2. SIMILARES: Verifica manualmente y normaliza los que sean iguales")
    print("3. NUEVOS: Copia el CSV de arriba y agrégalos a CAT_LOCALES")

if __name__ == '__main__':
    main()