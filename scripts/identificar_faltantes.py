"""
============================================
ACRUX-BIO - IDENTIFICAR LOCALES FALTANTES
Compara OPERATIVO vs CAT_LOCALES
============================================
"""

import os
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

SHEET_ID = os.getenv('SHEET_ID')
CREDENTIALS_FILE = 'credentials.json'

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
    print("🔍 IDENTIFICANDO LOCALES FALTANTES")
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
    
    # Crear set de locales existentes
    locales_existentes = set()
    for row in cat_locales:
        plaza = row.get('Plaza_Nombre', '')
        local = row.get('Nombre_Local', '')
        if plaza and local:
            key = f"{plaza}|{local}"
            locales_existentes.add(key)
    
    # Encontrar locales faltantes en OPERATIVO
    locales_faltantes = defaultdict(set)
    
    for row in operativo:
        plaza = row.get('Plaza')
        local = row.get('Local')
        
        if not plaza or not local:
            continue
        
        plaza = str(plaza).strip()
        local = str(local).strip()
        
        key = f"{plaza}|{local}"
        
        if key not in locales_existentes:
            locales_faltantes[plaza].add(local)
    
    # Mostrar resultados
    print("\n" + "=" * 80)
    print("📋 LOCALES FALTANTES POR PLAZA")
    print("=" * 80)
    
    if not locales_faltantes:
        print("\n✅ ¡No hay locales faltantes! Todos están en CAT_LOCALES")
        return
    
    total_faltantes = sum(len(locales) for locales in locales_faltantes.values())
    print(f"\n⚠️  Total de locales faltantes: {total_faltantes}")
    print("\n")
    
    # Ordenar por plaza
    for plaza in sorted(locales_faltantes.keys()):
        locales = sorted(locales_faltantes[plaza])
        print(f"📍 {plaza} ({len(locales)} locales faltantes)")
        print("-" * 80)
        
        for local in locales:
            print(f"   • {local}")
        
        print()
    
    # Generar CSV para fácil importación
    print("=" * 80)
    print("📄 FORMATO CSV PARA COPIAR A CAT_LOCALES")
    print("=" * 80)
    print("\nCopia esto y pégalo en CAT_LOCALES:")
    print("\nPlaza_Nombre,Nombre_Local")
    
    for plaza in sorted(locales_faltantes.keys()):
        for local in sorted(locales_faltantes[plaza]):
            print(f"{plaza},{local}")
    
    print("\n" + "=" * 80)
    print(f"✅ Identificados {total_faltantes} locales faltantes")
    print("=" * 80)
    print("\n💡 Próximos pasos:")
    print("   1. Copia el CSV de arriba")
    print("   2. Pégalo en CAT_LOCALES (después de la última fila)")
    print("   3. Completa las columnas Plaza_ID manualmente")
    print("   4. Vuelve a ejecutar: python scripts/migrate.py")

if __name__ == '__main__':
    main()