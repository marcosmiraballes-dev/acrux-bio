"""
============================================
ACRUX-BIO - MIGRACIÓN COMPLETA
Google Sheets → Supabase
Versión Final con Correcciones
============================================
"""

import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SHEET_ID = os.getenv('SHEET_ID')
CREDENTIALS_FILE = 'credentials.json'

class SupabaseClient:
    """Cliente simple de Supabase usando requests"""
    
    def __init__(self, url, key):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def insert(self, table, data):
        """Insertar datos en una tabla"""
        url = f"{self.url}/rest/v1/{table}"
        response = requests.post(url, headers=self.headers, json=data)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"Error {response.status_code}: {response.text}")
    
    def select(self, table, columns='*', filters=None):
        """Seleccionar datos de una tabla"""
        url = f"{self.url}/rest/v1/{table}?select={columns}"
        
        if filters:
            for key, value in filters.items():
                url += f"&{key}=eq.{value}"
        
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error {response.status_code}: {response.text}")

def conectar_google_sheets():
    """Conectar a Google Sheets"""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        if not os.path.exists(CREDENTIALS_FILE):
            print(f"\n❌ ERROR: No se encuentra {CREDENTIALS_FILE}")
            return None
        
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
    except ImportError:
        print("\n❌ ERROR: Instala gspread: python -m pip install gspread google-auth")
        return None
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return None

def exportar_hoja(spreadsheet, nombre_hoja):
    """Exportar hoja a lista de diccionarios"""
    try:
        worksheet = spreadsheet.worksheet(nombre_hoja)
        data = worksheet.get_all_values()
        
        if not data or len(data) < 2:
            print(f"   ⚠️  '{nombre_hoja}' vacía")
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
        
        print(f"   ✅ {nombre_hoja}: {len(result)} registros")
        return result
        
    except Exception as e:
        print(f"   ❌ Error en '{nombre_hoja}': {e}")
        return []

def obtener_mapas(supabase):
    """Obtener mapas de IDs desde Supabase"""
    try:
        # Plazas
        plazas = supabase.select('plazas', 'id,nombre')
        plaza_map = {p['nombre']: p['id'] for p in plazas}
        
        # Locales con su plaza
        locales = supabase.select('locales', 'id,nombre,plaza_id,plazas(nombre)')
        local_map = {}
        for l in locales:
            if l.get('plazas'):
                plaza_nombre = l['plazas']['nombre']
                key = f"{plaza_nombre}|{l['nombre']}"
                local_map[key] = {
                    'id': l['id'],
                    'plaza_id': l['plaza_id']
                }
        
        # Tipos de residuos
        residuos = supabase.select('tipos_residuos', 'id,nombre,factor_co2')
        residuo_map = {}
        for r in residuos:
            residuo_map[r['nombre']] = {
                'id': r['id'],
                'factor_co2': float(r['factor_co2'] or 0.5)
            }
        
        # Usuario admin
        usuarios = supabase.select('usuarios', 'id,email')
        usuario_admin_id = usuarios[0]['id'] if usuarios else None
        
        return plaza_map, local_map, residuo_map, usuario_admin_id
    except Exception as e:
        print(f"   ❌ Error obteniendo mapas: {e}")
        return {}, {}, {}, None

def migrar_recolecciones(supabase, datos, local_map, residuo_map, usuario_id):
    """Migrar recolecciones desde OPERATIVO"""
    
    # Columnas de residuos en orden
    tipos_residuos = [
        'Orgánico', 'Inorgánico', 'Cartón', 'Aluminio', 'Archivo',
        'Plástico Duro', 'PET', 'Playo', 'Vidrio', 'Tetra Pak', 'Chatarra'
    ]
    
    exitosas = 0
    errores = 0
    errores_detalle = []
    
    total = len(datos)
    print(f"\n   📦 Migrando {total} recolecciones...")
    print(f"   ⏱️  Esto tardará ~10-15 minutos...\n")
    
    for i, row in enumerate(datos, 1):
        try:
            # Extraer datos con validación robusta
            fecha = row.get('Fecha')
            plaza = row.get('Plaza')  
            local = row.get('Local')
            
            # Saltar si alguno es None
            if fecha is None or plaza is None or local is None:
                errores += 1
                if errores <= 5:
                    errores_detalle.append(f"Fila {i}: Datos None")
                continue
            
            # Convertir a string y hacer strip de forma segura
            try:
                fecha = str(fecha).strip()
                plaza = str(plaza).strip()
                local = str(local).strip()
            except:
                errores += 1
                if errores <= 5:
                    errores_detalle.append(f"Fila {i}: Error en strip")
                continue
            
            # Saltar si quedaron vacíos después del strip
            if not fecha or not plaza or not local:
                errores += 1
                if errores <= 5:
                    errores_detalle.append(f"Fila {i}: Datos vacíos")
                continue
            
            # Buscar local_id
            key = f"{plaza}|{local}"
            local_info = local_map.get(key)
            
            if not local_info:
                errores += 1
                if errores <= 5:
                    errores_detalle.append(f"Fila {i}: Local no encontrado: {plaza}|{local}")
                continue
            
            # Parsear fecha
            try:
                if '/' in fecha:
                    fecha_obj = datetime.strptime(fecha, '%d/%m/%Y')
                else:
                    fecha_obj = datetime.strptime(fecha, '%Y-%m-%d')
                fecha_str = fecha_obj.strftime('%Y-%m-%d')
            except:
                errores += 1
                if errores <= 5:
                    errores_detalle.append(f"Fila {i}: Fecha inválida: {fecha}")
                continue
            
            # Crear recolección
            recoleccion = {
                'usuario_id': usuario_id,
                'plaza_id': local_info['plaza_id'],
                'local_id': local_info['id'],
                'fecha_recoleccion': fecha_str,
                'notas': None
            }
            
            result = supabase.insert('recolecciones', recoleccion)
            
            if not result or len(result) == 0:
                errores += 1
                continue
            
            recoleccion_id = result[0]['id']
            
            # Crear detalles por cada tipo de residuo
            for tipo in tipos_residuos:
                kilos_str = row.get(tipo, '0')
                
                if kilos_str is None or kilos_str == '':
                    continue
                
                try:
                    kilos_str = str(kilos_str).strip().replace(',', '.')
                    kilos = float(kilos_str)
                except:
                    continue
                
                if kilos <= 0:
                    continue
                
                residuo_info = residuo_map.get(tipo)
                if not residuo_info:
                    continue
                
                detalle = {
                    'recoleccion_id': recoleccion_id,
                    'tipo_residuo_id': residuo_info['id'],
                    'kilos': kilos,
                    'co2_evitado': kilos * residuo_info['factor_co2']
                }
                
                try:
                    supabase.insert('detalle_recolecciones', detalle)
                except:
                    pass  # Continuar aunque falle un detalle
            
            exitosas += 1
            
            # Mostrar progreso cada 100
            if i % 100 == 0:
                porcentaje = (i / total) * 100
                print(f"      📊 Progreso: {i}/{total} ({porcentaje:.1f}%) - {exitosas} exitosas, {errores} errores")
        
        except Exception as e:
            errores += 1
            if errores <= 5:
                errores_detalle.append(f"Fila {i}: {str(e)[:80]}")
    
    # Mostrar errores si los hubo
    if errores_detalle:
        print(f"\n   ⚠️  Primeros errores encontrados:")
        for error in errores_detalle:
            print(f"      - {error}")
    
    print(f"\n   ✅ Completado: {exitosas} exitosas, {errores} errores")
    return exitosas

def main():
    print("=" * 60)
    print("🌟 ACRUX-BIO - MIGRACIÓN COMPLETA")
    print("   Google Sheets → Supabase")
    print("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_KEY or not SHEET_ID:
        print("\n❌ ERROR: Configura .env correctamente")
        return
    
    print("\n✅ Configuración verificada")
    
    try:
        import requests
    except ImportError:
        print("\n❌ ERROR: Instala requests")
        return
    
    print("\n🔗 Conectando a servicios...")
    
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    print("   ✅ Supabase conectado")
    
    spreadsheet = conectar_google_sheets()
    if not spreadsheet:
        return
    print("   ✅ Google Sheets conectado")
    
    # Obtener mapas
    print("\n🗺️  Obteniendo mapas de IDs...")
    plaza_map, local_map, residuo_map, usuario_id = obtener_mapas(supabase)
    print(f"   ✅ {len(plaza_map)} plazas")
    print(f"   ✅ {len(local_map)} locales")
    print(f"   ✅ {len(residuo_map)} tipos de residuos")
    
    # Exportar OPERATIVO
    print("\n📊 Exportando OPERATIVO...")
    datos_operativo = exportar_hoja(spreadsheet, 'OPERATIVO')
    
    if not datos_operativo:
        print("\n❌ No hay datos para migrar")
        return
    
    # Migrar recolecciones
    print("\n📤 MIGRANDO RECOLECCIONES")
    exitosas = migrar_recolecciones(
        supabase, 
        datos_operativo, 
        local_map, 
        residuo_map, 
        usuario_id
    )
    
    print("\n" + "=" * 60)
    print("✅ MIGRACIÓN COMPLETADA")
    print("=" * 60)
    print(f"\n📊 Total migrado: {exitosas} recolecciones")
    print("\n💡 Verifica en Supabase:")
    print("   Table Editor → recolecciones")
    print("   Table Editor → detalle_recolecciones")

if __name__ == '__main__':
    main()