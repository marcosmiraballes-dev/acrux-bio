"""
SCRIPT DE MIGRACIÓN - EJECUTAR DESPUÉS DE CREAR LOCALES
"""

import csv
import requests
from datetime import datetime

SUPABASE_URL = 'https://jwtldicqtdorshfcvrjk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGxkaWNxdGRvcnNoZmN2cmprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA4NzYxOCwiZXhwIjoyMDgxNjYzNjE4fQ.mqOUXQv1s7kPITFsRqkorxvfzxOgkjNbUXDqPquxv48'
CSV_FILE = 'recolecciones.csv'
USUARIO_ADMIN_ID = 'f092df7f-c771-4e75-a84b-59692cc32b99'

PLAZAS = {
    "Plaza Am\u00e9ricas - Malec\u00f3n": "2c983cd6-f756-494d-a1c1-ff251b337ad5",
    "Plaza Am\u00e9ricas - Playa": "3dece273-3dfe-495a-b15c-4508451a01ae",
    "Plaza Mall": "eef705d0-709d-47b6-853a-c88b57984c59",
    "Plaza Puerto Canc\u00fan": "3b48675e-8a3c-4b2b-8616-dc944a139cb0"
}

PLAZA_NORMALIZE = {
    "Plaza Am\u00e9ricas_Malec\u00f3n": "Plaza Am\u00e9ricas - Malec\u00f3n",
    "Plaza_Am\u00e9ricas_Playa": "Plaza Am\u00e9ricas - Playa",
    "Plaza Mall": "Plaza Mall",
    "Plaza Puerto Canc\u00fan": "Plaza Puerto Canc\u00fan"
}

RESIDUOS = {
    "Organico": {
        "id": "e1034c62-bd59-4182-bed0-e517bd1f17f6",
        "factor_co2": 0.1
    },
    "Inorganico": {
        "id": "a23b0971-7711-4cdd-92ce-d0081ff72aeb",
        "factor_co2": 0.5
    },
    "Carton": {
        "id": "85bb91f7-e2e1-4ed9-8e72-45a705224456",
        "factor_co2": 1.5
    },
    "Aluminio": {
        "id": "ec3cfb20-82f2-4fa0-bd5c-b4c85a15156e",
        "factor_co2": 1.2
    },
    "Archivo": {
        "id": "9b008fe7-fbd3-4472-8a3e-65f4af431a5e",
        "factor_co2": 1.5
    },
    "Plastico_Duro": {
        "id": "24267f9c-377e-4d56-8620-9107250bf7bd",
        "factor_co2": 2.0
    },
    "Pet": {
        "id": "b2db9ca3-efa8-47fe-a398-00080390eaba",
        "factor_co2": 1.8
    },
    "Playo": {
        "id": "18abec8c-0eca-4ac3-94a2-96e29575ab6f",
        "factor_co2": 2.0
    },
    "Vidrio": {
        "id": "93077770-4e38-491f-9434-e00f1641d4f7",
        "factor_co2": 0.5
    },
    "Tetra_Pak": {
        "id": "8096049e-02ed-4221-a25b-f25c96b92232",
        "factor_co2": 1.3
    },
    "Chatarra": {
        "id": "733dda8e-f01a-42dd-a83f-c65e781493fc",
        "factor_co2": 1.2
    }
}

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def obtener_locales_map():
    """Obtener mapa de locales desde Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/locales?select=id,nombre,plaza_id,plazas(nombre)"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Error obteniendo locales: {response.text}")
    
    locales = response.json()
    local_map = {}
    
    for local in locales:
        if local.get('plazas'):
            plaza_nombre = local['plazas']['nombre']
            key = f"{plaza_nombre}|{local['nombre']}"
            local_map[key] = {
                'id': local['id'],
                'plaza_id': local['plaza_id']
            }
    
    return local_map

def migrar():
    print("="*80)
    print("MIGRACIÓN DE RECOLECCIONES")
    print("="*80)
    
    # Obtener locales
    print("\n📍 Obteniendo mapa de locales...")
    local_map = obtener_locales_map()
    print(f"   ✅ {len(local_map)} locales mapeados")
    
    # Leer CSV
    print("\n📄 Leyendo CSV...")
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f"   ✅ {len(rows):,} registros")
    
    # Migrar por batches
    print("\n🚀 Iniciando migración...")
    exitosas = 0
    errores = 0
    batch_size = 100
    
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        
        for row in batch:
            try:
                # Normalizar plaza
                plaza_raw = row.get('Plaza', '').strip()
                plaza = PLAZA_NORMALIZE.get(plaza_raw, plaza_raw)
                local_nombre = row.get('Local_Consolidado', '').strip()
                
                if not plaza or not local_nombre:
                    errores += 1
                    continue
                
                # Buscar local
                key = f"{plaza}|{local_nombre}"
                local_info = local_map.get(key)
                
                if not local_info:
                    errores += 1
                    if errores <= 10:
                        print(f"   ⚠️  Local no encontrado: {key}")
                    continue
                
                # Parsear fecha
                fecha_raw = row.get('Fecha', '').strip()
                try:
                    fecha_obj = datetime.strptime(fecha_raw, '%d/%m/%Y')
                    fecha_str = fecha_obj.strftime('%Y-%m-%d')
                except:
                    errores += 1
                    continue
                
                # Crear recolección
                recoleccion = {
                    'usuario_id': USUARIO_ADMIN_ID,
                    'plaza_id': local_info['plaza_id'],
                    'local_id': local_info['id'],
                    'fecha_recoleccion': fecha_str,
                    'notas': None
                }
                
                url = f"{SUPABASE_URL}/rest/v1/recolecciones"
                response = requests.post(url, headers=headers, json=recoleccion)
                
                if response.status_code not in [200, 201]:
                    errores += 1
                    continue
                
                result = response.json()
                if not result or len(result) == 0:
                    errores += 1
                    continue
                
                recoleccion_id = result[0]['id']
                
                # Crear detalles
                for col_residuo, info in RESIDUOS.items():
                    kilos_str = row.get(col_residuo, '0').strip().replace(',', '.')
                    
                    try:
                        kilos = float(kilos_str)
                    except:
                        continue
                    
                    if kilos <= 0:
                        continue
                    
                    detalle = {
                        'recoleccion_id': recoleccion_id,
                        'tipo_residuo_id': info['id'],
                        'kilos': kilos,
                        'co2_evitado': kilos * info['factor_co2']
                    }
                    
                    url = f"{SUPABASE_URL}/rest/v1/detalle_recolecciones"
                    requests.post(url, headers=headers, json=detalle)
                
                exitosas += 1
                
            except Exception as e:
                errores += 1
        
        # Progreso
        print(f"   📊 Progreso: {min(i+batch_size, len(rows))}/{len(rows)} - {exitosas} exitosas, {errores} errores")
    
    print("\n" + "="*80)
    print("✅ MIGRACIÓN COMPLETADA")
    print("="*80)
    print(f"\n📊 Exitosas: {exitosas:,}")
    print(f"⚠️  Errores: {errores:,}")

if __name__ == '__main__':
    migrar()
