"""
SCRIPT DE MIGRACIÓN OPTIMIZADO - BATCH INSERT
Procesa en lotes grandes para máxima velocidad
"""

import csv
import requests
from datetime import datetime

SUPABASE_URL = 'https://jwtldicqtdorshfcvrjk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGxkaWNxdGRvcnNoZmN2cmprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA4NzYxOCwiZXhwIjoyMDgxNjYzNjE4fQ.mqOUXQv1s7kPITFsRqkorxvfzxOgkjNbUXDqPquxv48'
CSV_FILE = 'recolecciones.csv'
USUARIO_ADMIN_ID = 'f092df7f-c771-4e75-a84b-59692cc32b99'

PLAZAS = {
    'Plaza Américas - Malecón': '2c983cd6-f756-494d-a1c1-ff251b337ad5',
    'Plaza Américas - Playa': '3dece273-3dfe-495a-b15c-4508451a01ae',
    'Plaza Mall': 'eef705d0-709d-47b6-853a-c88b57984c59',
    'Plaza Puerto Cancún': '3b48675e-8a3c-4b2b-8616-dc944a139cb0'
}

PLAZA_NORMALIZE = {
    'Plaza Américas_Malecón': 'Plaza Américas - Malecón',
    'Plaza_Américas_Playa': 'Plaza Américas - Playa',
    'Plaza Mall': 'Plaza Mall',
    'Plaza Puerto Cancún': 'Plaza Puerto Cancún'
}

RESIDUOS = {
    'Organico': {'id': 'e1034c62-bd59-4182-bed0-e517bd1f17f6', 'factor_co2': 0.1},
    'Inorganico': {'id': 'a23b0971-7711-4cdd-92ce-d0081ff72aeb', 'factor_co2': 0.5},
    'Carton': {'id': '85bb91f7-e2e1-4ed9-8e72-45a705224456', 'factor_co2': 1.5},
    'Aluminio': {'id': 'ec3cfb20-82f2-4fa0-bd5c-b4c85a15156e', 'factor_co2': 1.2},
    'Archivo': {'id': '9b008fe7-fbd3-4472-8a3e-65f4af431a5e', 'factor_co2': 1.5},
    'Plastico_Duro': {'id': '24267f9c-377e-4d56-8620-9107250bf7bd', 'factor_co2': 2.0},
    'Pet': {'id': 'b2db9ca3-efa8-47fe-a398-00080390eaba', 'factor_co2': 1.8},
    'Playo': {'id': '18abec8c-0eca-4ac3-94a2-96e29575ab6f', 'factor_co2': 2.0},
    'Vidrio': {'id': '93077770-4e38-491f-9434-e00f1641d4f7', 'factor_co2': 0.5},
    'Tetra_Pak': {'id': '8096049e-02ed-4221-a25b-f25c96b92232', 'factor_co2': 1.3},
    'Chatarra': {'id': '733dda8e-f01a-42dd-a83f-c65e781493fc', 'factor_co2': 1.2}
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
            key = f"{plaza_nombre}|{local['nombre'].upper()}"
            local_map[key] = {
                'id': local['id'],
                'plaza_id': local['plaza_id']
            }
    
    return local_map

def procesar_csv(local_map):
    """Leer CSV y preparar datos para batch insert"""
    print("\n📄 Leyendo y procesando CSV...")
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"   ✅ {len(rows):,} registros leídos")
    
    recolecciones_batch = []
    detalles_pendientes = []
    errores = 0
    
    for i, row in enumerate(rows, 1):
        try:
            # Normalizar plaza
            plaza_raw = row.get('Plaza', '').strip()
            plaza = PLAZA_NORMALIZE.get(plaza_raw, plaza_raw)
            local_nombre = row.get('Local_Consolidado', '').strip()
            
            if not plaza or not local_nombre:
                errores += 1
                continue
            
            # Buscar local
            key = f"{plaza}|{local_nombre.upper()}"
            local_info = local_map.get(key)
            
            if not local_info:
                errores += 1
                continue
            
            # Parsear fecha
            fecha_raw = row.get('Fecha', '').strip()
            try:
                fecha_obj = datetime.strptime(fecha_raw, '%d/%m/%Y')
                fecha_str = fecha_obj.strftime('%Y-%m-%d')
            except:
                errores += 1
                continue
            
            # Preparar recolección
            recoleccion = {
                'usuario_id': USUARIO_ADMIN_ID,
                'plaza_id': local_info['plaza_id'],
                'local_id': local_info['id'],
                'fecha_recoleccion': fecha_str,
                'notas': None
            }
            
            # Guardar detalles para después
            detalles = []
            for col_residuo, info in RESIDUOS.items():
                kilos_str = row.get(col_residuo, '0').strip().replace(',', '.')
                
                try:
                    kilos = float(kilos_str)
                except:
                    continue
                
                if kilos <= 0:
                    continue
                
                detalles.append({
                    'tipo_residuo_id': info['id'],
                    'kilos': kilos,
                    'co2_evitado': kilos * info['factor_co2']
                })
            
            if detalles:  # Solo si hay residuos
                recolecciones_batch.append(recoleccion)
                detalles_pendientes.append(detalles)
            
            if i % 1000 == 0:
                print(f"   📊 Procesados: {i:,}/{len(rows):,} - Errores: {errores}")
        
        except Exception as e:
            errores += 1
    
    print(f"\n   ✅ Procesamiento completo")
    print(f"   📊 Válidas: {len(recolecciones_batch):,}")
    print(f"   ⚠️  Errores: {errores:,}")
    
    return recolecciones_batch, detalles_pendientes

def insertar_batch(recolecciones, detalles_list):
    """Insertar recolecciones y detalles en batches grandes"""
    
    BATCH_SIZE = 500  # Supabase soporta hasta 1000, usamos 500 por seguridad
    total = len(recolecciones)
    exitosas = 0
    
    print(f"\n🚀 Insertando {total:,} recolecciones en batches de {BATCH_SIZE}...")
    
    for i in range(0, total, BATCH_SIZE):
        batch_recolecciones = recolecciones[i:i+BATCH_SIZE]
        batch_detalles = detalles_list[i:i+BATCH_SIZE]
        
        try:
            # Insertar batch de recolecciones
            url = f"{SUPABASE_URL}/rest/v1/recolecciones"
            response = requests.post(url, headers=headers, json=batch_recolecciones)
            
            if response.status_code not in [200, 201]:
                print(f"   ⚠️  Error batch {i}-{i+len(batch_recolecciones)}: {response.text[:100]}")
                continue
            
            results = response.json()
            
            if not results or len(results) == 0:
                print(f"   ⚠️  Sin resultados batch {i}-{i+len(batch_recolecciones)}")
                continue
            
            # Preparar detalles con IDs de recolecciones
            all_detalles = []
            for j, recoleccion_result in enumerate(results):
                recoleccion_id = recoleccion_result['id']
                
                for detalle in batch_detalles[j]:
                    all_detalles.append({
                        'recoleccion_id': recoleccion_id,
                        **detalle
                    })
            
            # Insertar todos los detalles de este batch
            if all_detalles:
                url_detalles = f"{SUPABASE_URL}/rest/v1/detalle_recolecciones"
                response_detalles = requests.post(url_detalles, headers=headers, json=all_detalles)
                
                if response_detalles.status_code not in [200, 201]:
                    print(f"   ⚠️  Error detalles batch {i}: {response_detalles.text[:100]}")
            
            exitosas += len(results)
            print(f"   ✅ Batch {i//BATCH_SIZE + 1}: {len(results)} recolecciones insertadas - Total: {exitosas:,}/{total:,}")
        
        except Exception as e:
            print(f"   ❌ Error batch {i}: {str(e)[:100]}")
    
    return exitosas

def migrar():
    print("="*80)
    print("MIGRACIÓN OPTIMIZADA DE RECOLECCIONES (BATCH MODE)")
    print("="*80)
    
    # Obtener locales
    print("\n📍 Obteniendo mapa de locales...")
    local_map = obtener_locales_map()
    print(f"   ✅ {len(local_map)} locales mapeados")
    
    # Procesar CSV
    recolecciones, detalles_list = procesar_csv(local_map)
    
    # Insertar en batches
    exitosas = insertar_batch(recolecciones, detalles_list)
    
    print("\n" + "="*80)
    print("✅ MIGRACIÓN COMPLETADA")
    print("="*80)
    print(f"\n📊 Recolecciones insertadas: {exitosas:,}")
    print(f"📊 Detalles estimados: {exitosas * 3:,} (promedio 3 residuos por recolección)")

if __name__ == '__main__':
    migrar()