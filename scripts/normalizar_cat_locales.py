"""
============================================
ACRUX-BIO - NORMALIZAR CAT_LOCALES
Corrige nombres de plazas con guiones bajos
============================================
"""

import os
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv('SHEET_ID')
CREDENTIALS_FILE = 'credentials.json'

def conectar_google_sheets():
    """Conectar a Google Sheets"""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
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

def normalizar_cat_locales():
    """Normalizar nombres de plazas en CAT_LOCALES"""
    
    # Mapeo de nombres incorrectos a correctos
    mapeo = {
        'Plaza_Américas_Malecón': 'Plaza Américas - Malecón',
        'Plaza_Américas_Malecon': 'Plaza Américas - Malecón',
        'Plaza Américas_Malecón': 'Plaza Américas - Malecón',
        'Plaza_Américas_Playa': 'Plaza Américas - Playa',
        'Plaza Américas_Playa': 'Plaza Américas - Playa',
        'PLAZA MALL': 'Plaza Mall',
        'Plaza mall': 'Plaza Mall',
        'PLAZA PUERTO CANCUN': 'Plaza Puerto Cancún',
        'Plaza puerto cancun': 'Plaza Puerto Cancún',
        'PUERTO CANCUN': 'Plaza Puerto Cancún',
        'Plaza Puerto Cancun': 'Plaza Puerto Cancún'
    }
    
    print("=" * 60)
    print("🔧 NORMALIZANDO CAT_LOCALES")
    print("=" * 60)
    
    spreadsheet = conectar_google_sheets()
    if not spreadsheet:
        return
    
    print("\n✅ Conectado a Google Sheets")
    print("\n📝 Procesando CAT_LOCALES...")
    
    try:
        sheet = spreadsheet.worksheet('CAT_LOCALES')
        
        # Obtener columna C (Plaza_Nombre) completa
        plaza_col = sheet.col_values(3)  # Columna C
        
        print(f"\n   📊 Total filas: {len(plaza_col)}")
        
        # Preparar actualizaciones por lotes
        updates = []
        cambios = 0
        
        for i, valor in enumerate(plaza_col[1:], start=2):  # Empezar desde fila 2
            if valor in mapeo:
                nuevo_valor = mapeo[valor]
                updates.append({
                    'range': f'C{i}',
                    'values': [[nuevo_valor]]
                })
                cambios += 1
                if cambios <= 5:
                    print(f"      '{valor}' → '{nuevo_valor}'")
        
        if cambios > 0:
            print(f"\n   ✏️  Actualizando {cambios} registros...")
            
            # Actualizar por lotes de 1000 (límite de Google)
            batch_size = 1000
            for i in range(0, len(updates), batch_size):
                batch = updates[i:i+batch_size]
                sheet.batch_update(batch)
                print(f"      ✅ Procesados {min(i+batch_size, len(updates))}/{len(updates)}")
            
            print(f"\n   ✅ {cambios} nombres actualizados")
        else:
            print("\n   ℹ️  No se encontraron nombres para normalizar")
        
        print("\n" + "=" * 60)
        print("✅ NORMALIZACIÓN COMPLETADA")
        print("=" * 60)
        print("\n💡 Próximos pasos:")
        print("   1. python scripts/comparar_locales.py")
        print("   2. Agregar los locales nuevos que realmente falten")
        print("   3. python scripts/migrate.py")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == '__main__':
    normalizar_cat_locales()