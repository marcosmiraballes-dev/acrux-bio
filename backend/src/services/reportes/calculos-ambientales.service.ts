/**
 * Servicio de Cálculos Ambientales
 * Contiene todos los factores de conversión y cálculos de impacto ambiental
 */

export class CalculosAmbientalesService {
  
  // Factores de conversión ambientales
  private readonly FACTORES = {
    // Árboles: 1 árbol captura aproximadamente 22 kg de CO₂ por año
    arboles: {
      kg_co2_por_arbol_anio: 22
    },
    
    // Autos: auto promedio emite 0.12 kg CO₂ por km
    autos: {
      kg_co2_por_km: 0.12
    },
    
    // Energía por kg de material (kWh ahorrados al reciclar)
    energia: {
      'PET': 2.0,
      'Plástico Duro': 1.8,
      'Vidrio': 0.9,
      'Cartón': 1.2,
      'Papel': 1.5,
      'Aluminio': 14.0,
      'Chatarra': 10.0,
      'default': 1.0
    } as { [key: string]: number },
    
    // Agua ahorrada por kg de material (litros)
    agua: {
      'PET': 2.0,
      'Plástico Duro': 2.0,
      'Cartón': 15.0,
      'Papel': 20.0,
      'Aluminio': 8.0,
      'default': 1.0
    } as { [key: string]: number },
    
    // Petróleo equivalente (litros por kg de plástico)
    petroleo: {
      kg_por_litro: 2.0 // 1 kg de plástico ≈ 2 litros de petróleo
    },
    
    // Energía: 1 kWh = 0.5 kg CO₂ (promedio)
    energia_co2: {
      kg_co2_por_kwh: 0.5
    },
    
    // Árboles salvados por material
    arboles_salvados: {
      'Cartón': 0.017,  // 1 kg cartón ≈ 0.017 árboles
      'Papel': 0.02,
      'default': 0
    } as { [key: string]: number }
  };

  /**
   * Calcula árboles equivalentes basado en CO₂ evitado
   */
  calcularArbolesEquivalentes(co2_kg: number): number {
    return Math.round(co2_kg / this.FACTORES.arboles.kg_co2_por_arbol_anio);
  }

  /**
   * Calcula kilómetros equivalentes en auto
   */
  calcularKmAuto(co2_kg: number): number {
    return Math.round(co2_kg / this.FACTORES.autos.kg_co2_por_km);
  }

  /**
   * Calcula energía ahorrada (kWh) por tipo de material
   */
  calcularEnergiaAhorrada(kilos: number, tipoMaterial: string): number {
    const factor = this.FACTORES.energia[tipoMaterial] || this.FACTORES.energia.default;
    return Math.round(kilos * factor * 100) / 100;
  }

  /**
   * Calcula agua ahorrada (litros) por tipo de material
   */
  calcularAguaAhorrada(kilos: number, tipoMaterial: string): number {
    const factor = this.FACTORES.agua[tipoMaterial] || this.FACTORES.agua.default;
    return Math.round(kilos * factor);
  }

  /**
   * Calcula petróleo ahorrado (litros) para plásticos
   */
  calcularPetroleoAhorrado(kilos_plastico: number): number {
    return Math.round(kilos_plastico * this.FACTORES.petroleo.kg_por_litro);
  }

  /**
   * Calcula árboles salvados por material específico
   */
  calcularArbolesSalvados(kilos: number, tipoMaterial: string): number {
    const factor = this.FACTORES.arboles_salvados[tipoMaterial] || this.FACTORES.arboles_salvados.default;
    return Math.round(kilos * factor);
  }

  /**
   * Calcula hogares abastecidos por 1 mes (1 hogar ≈ 300 kWh/mes)
   */
  calcularHogaresAbastecidos(energia_kwh: number): number {
    const kwh_por_hogar_mes = 300;
    return Math.round(energia_kwh / kwh_por_hogar_mes);
  }

  /**
   * Calcula impacto completo por tipo de material
   */
  calcularImpactoPorMaterial(tipoMaterial: string, kilos: number, co2_evitado: number) {
    const impacto: any = {
      tipo: tipoMaterial,
      kilos: kilos,
      co2_evitado_kg: co2_evitado,
      co2_evitado_ton: Math.round(co2_evitado / 1000 * 100) / 100,
      energia_kwh: this.calcularEnergiaAhorrada(kilos, tipoMaterial),
      agua_litros: this.calcularAguaAhorrada(kilos, tipoMaterial)
    };

    // Cálculos específicos por tipo
    if (tipoMaterial.includes('PET') || tipoMaterial.includes('Plástico')) {
      impacto.petroleo_litros = this.calcularPetroleoAhorrado(kilos);
      impacto.botellas_equivalentes = Math.round(kilos); // 1kg ≈ 1 botella de 1L
    }

    if (tipoMaterial === 'Cartón' || tipoMaterial === 'Papel') {
      impacto.arboles_salvados = this.calcularArbolesSalvados(kilos, tipoMaterial);
    }

    if (tipoMaterial === 'Aluminio') {
      impacto.latas_equivalentes = Math.round(kilos / 0.015); // 1 lata ≈ 15g
    }

    return impacto;
  }

  /**
   * Calcula impacto total agregado de múltiples materiales
   */
  calcularImpactoTotal(materiales: Array<{tipo: string, kilos: number, co2_evitado: number}>) {
    const total_kilos = materiales.reduce((sum, m) => sum + m.kilos, 0);
    const total_co2 = materiales.reduce((sum, m) => sum + m.co2_evitado, 0);
    
    // Calcular totales de energía y agua
    let total_energia = 0;
    let total_agua = 0;
    let total_petroleo = 0;
    let total_arboles_salvados = 0;

    materiales.forEach(m => {
      total_energia += this.calcularEnergiaAhorrada(m.kilos, m.tipo);
      total_agua += this.calcularAguaAhorrada(m.kilos, m.tipo);
      
      if (m.tipo.includes('PET') || m.tipo.includes('Plástico')) {
        total_petroleo += this.calcularPetroleoAhorrado(m.kilos);
      }
      
      if (m.tipo === 'Cartón' || m.tipo === 'Papel') {
        total_arboles_salvados += this.calcularArbolesSalvados(m.kilos, m.tipo);
      }
    });

    return {
      total_kilos: Math.round(total_kilos * 100) / 100,
      total_co2_kg: Math.round(total_co2 * 100) / 100,
      total_co2_ton: Math.round(total_co2 / 1000 * 100) / 100,
      
      // Equivalencias generales
      arboles_equivalentes: this.calcularArbolesEquivalentes(total_co2),
      km_auto_equivalentes: this.calcularKmAuto(total_co2),
      
      // Recursos ahorrados
      energia_kwh: Math.round(total_energia * 100) / 100,
      agua_litros: total_agua,
      petroleo_litros: total_petroleo,
      arboles_salvados: total_arboles_salvados,
      
      // Hogares
      hogares_abastecidos: this.calcularHogaresAbastecidos(total_energia),
      
      // Desglose
      materiales_impacto: materiales.map(m => this.calcularImpactoPorMaterial(m.tipo, m.kilos, m.co2_evitado))
    };
  }

  /**
   * Genera mensaje descriptivo del impacto
   */
  generarMensajesImpacto(impacto: any): string[] {
    const mensajes: string[] = [];

    if (impacto.arboles_equivalentes > 0) {
      mensajes.push(`Equivale a plantar ${impacto.arboles_equivalentes.toLocaleString()} árboles`);
    }

    if (impacto.km_auto_equivalentes > 0) {
      mensajes.push(`Equivale a NO recorrer ${impacto.km_auto_equivalentes.toLocaleString()} km en auto`);
    }

    if (impacto.energia_kwh > 0) {
      mensajes.push(`Ahorra ${impacto.energia_kwh.toLocaleString()} kWh de energía`);
    }

    if (impacto.agua_litros > 0) {
      mensajes.push(`Ahorra ${impacto.agua_litros.toLocaleString()} litros de agua`);
    }

    if (impacto.petroleo_litros > 0) {
      mensajes.push(`Ahorra ${impacto.petroleo_litros.toLocaleString()} litros de petróleo`);
    }

    if (impacto.arboles_salvados > 0) {
      mensajes.push(`Salva ${impacto.arboles_salvados} árboles`);
    }

    if (impacto.hogares_abastecidos > 0) {
      mensajes.push(`Puede abastecer ${impacto.hogares_abastecidos} hogares por 1 mes`);
    }

    return mensajes;
  }

  /**
   * Calcula proyección anual basada en datos actuales
   */
  calcularProyeccionAnual(kilos_actuales: number, dias_transcurridos: number) {
    const promedio_diario = kilos_actuales / dias_transcurridos;
    const proyeccion_anual = Math.round(promedio_diario * 365);
    
    return {
      promedio_diario: Math.round(promedio_diario * 100) / 100,
      proyeccion_anual: proyeccion_anual,
      proyeccion_mensual: Math.round(promedio_diario * 30),
      dias_transcurridos: dias_transcurridos
    };
  }
}

export const calculosAmbientalesService = new CalculosAmbientalesService();