// Agrupación visual FIJA de categorías para el bento del home (decisión del proyecto).
// Los grupos son decorativos; al pulsar una categoría se busca por su nombre (normalizado).
// Ajustar los nombres para que coincidan con las categorías reales que usen las tiendas.

export interface GrupoCategorias {
  grupo: string;
  categorias: string[];
}

export const GRUPOS_CATEGORIAS: GrupoCategorias[] = [
  { grupo: 'Tecnología', categorias: ['Computación', 'Celulares', 'Periféricos', 'Monitores', 'Impresoras'] },
  { grupo: 'Audio y Gaming', categorias: ['Audio', 'Parlantes', 'Audífonos', 'Consolas', 'Videojuegos'] },
  { grupo: 'Electrohogar', categorias: ['Climatización', 'Refrigeración', 'Lavadoras', 'Electrodomésticos'] },
  { grupo: 'Hogar y Decoración', categorias: ['Cocina', 'Muebles', 'Decoración', 'Iluminación', 'Termos y Vasos'] },
  { grupo: 'Deporte y Recreación', categorias: ['Gimnasio', 'Camping', 'Ropa Deportiva', 'Pádel', 'Bicicletas'] },
  { grupo: 'Belleza y Cuidado Personal', categorias: ['Maquillaje', 'Cuidado de Piel', 'Perfumería', 'Peluquería'] },
  { grupo: 'Vestimenta y Accesorios', categorias: ['Ropa', 'Calzado', 'Mochilas y Accesorios', 'Relojes'] },
  { grupo: 'Alimentos y Bebidas', categorias: ['Abarrotes', 'Bebidas', 'Snacks', 'Despensa'] },
  { grupo: 'Juguetes', categorias: ['Juguetes', 'Juegos de Mesa', 'Didácticos', 'Aire Libre'] },
];
