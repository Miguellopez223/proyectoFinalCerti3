// Contenido del footer de soporte (adaptado/simplificado del material fuente, genericizado a
// Klikea). No es asesoría legal; es texto orientativo para el proyecto.

export const CONTACTO = {
  whatsapp: '75359849',
  whatsappUrl: 'https://wa.me/59175359849',
  correo: 'miguel762005@gmail.com',
};

export interface InfoContenido {
  titulo: string;
  parrafos: string[];
}

export const INFO: Record<string, InfoContenido> = {
  // ── Soporte para clientes ────────────────────────────────────────────────
  'terminos-cliente': {
    titulo: 'Términos y condiciones',
    parrafos: [
      'Klikea es una plataforma de comercio electrónico que conecta a compradores con comercios afiliados. Al usar Klikea aceptás estos términos; te recomendamos leerlos con atención.',
      'Las compras se realizan entre vos y el comercio afiliado correspondiente. Klikea actúa como intermediario y facilita la plataforma, el catálogo y el pago.',
      'Para comprar necesitás una cuenta y un método de pago válido. Sos responsable de la actividad de tu cuenta y de mantener segura tu contraseña.',
      'Los precios pueden cambiar y los productos están sujetos a disponibilidad. El carrito muestra el precio más reciente. Klikea puede modificar estos términos avisando por la plataforma.',
    ],
  },
  envios: {
    titulo: 'Envíos',
    parrafos: [
      'El tiempo de entrega estimado se muestra antes de confirmar tu pedido. Los plazos son referenciales y pueden variar por alta demanda o causas de fuerza mayor.',
      'El costo de envío depende del tamaño, peso y dirección, y se te informa antes de pagar.',
      'Podés hacer seguimiento del pedido desde tu cuenta o escribiéndonos a nuestros canales de contacto.',
    ],
  },
  'puntos-recojo': {
    titulo: 'Puntos de recojo',
    parrafos: [
      'Si el comercio lo habilita, podés elegir "Recoger en tienda" al momento de comprar y retirar tu pedido presentando el número de pedido.',
      'Te avisaremos por correo cuando tu pedido esté listo para recoger. Revisá los montos antes de confirmar: no se cobran importes adicionales al retirar.',
    ],
  },
  'cambios-devoluciones': {
    titulo: 'Cambios y devoluciones',
    parrafos: [
      'Podés iniciar un reclamo por producto defectuoso o incorrecto dentro de los plazos indicados (en general, hasta 3 días hábiles tras recibirlo).',
      'El producto debe estar sin uso, en su empaque original con accesorios y etiquetas, y con su comprobante de compra.',
      'Algunos productos no admiten cambio ni devolución por higiene o naturaleza (ropa interior, trajes de baño, productos de cuidado personal, electrónicos abiertos, etc.).',
      'Para gestionar un cambio o devolución, escribinos a nuestros canales de contacto.',
    ],
  },
  garantias: {
    titulo: 'Garantías',
    parrafos: [
      'La garantía de cada producto la otorga y gestiona directamente el comercio afiliado.',
      'La cobertura y duración de la garantía se indican en la descripción del producto. Revisala antes de comprar.',
    ],
  },
  reclamos: {
    titulo: 'Reclamos',
    parrafos: [
      'Si recibís un producto dañado, incompleto o equivocado, revisalo al momento de la entrega y reportalo lo antes posible.',
      `Podés enviar tu reclamo por WhatsApp (${CONTACTO.whatsapp}) o al correo ${CONTACTO.correo}, indicando tu número de pedido.`,
    ],
  },
  'metodos-pago': {
    titulo: 'Métodos de pago',
    parrafos: [
      'Klikea procesa los pagos de forma segura. El método principal es el pago con código QR.',
      'Al confirmar tu compra se muestra un código QR en pantalla. Abrí la app de banca móvil de tu banco, elegí la opción de Pago/Cobro QR y escaneá (o seleccioná la imagen del QR desde tu galería) para completar el pago.',
      'El pago se confirma automáticamente; cuando se acredita, tu pedido pasa a estado "Pagado".',
    ],
  },
  contacto: {
    titulo: 'Contáctanos',
    parrafos: [
      `WhatsApp: ${CONTACTO.whatsapp}`,
      `Correo: ${CONTACTO.correo}`,
      'Te respondemos en horario de atención. Para temas de un pedido, tené a mano tu número de pedido.',
    ],
  },

  // ── Soporte para vendedores ──────────────────────────────────────────────
  'terminos-comercio': {
    titulo: 'Términos y Condiciones (comercios)',
    parrafos: [
      'Klikea es un espacio virtual donde los comercios afiliados publican y venden sus productos. Klikea actúa como intermediario y no es el vendedor de los artículos.',
      'El comercio es responsable de la veracidad de su información, precios, imágenes y stock, de emitir factura y de cumplir sus obligaciones impositivas.',
      'El comercio debe procesar los pedidos a tiempo, vender solo productos disponibles y describirlos con precisión en la categoría adecuada.',
      'El uso de la plataforma implica la aceptación de estos términos, que pueden actualizarse publicándolos en Klikea.',
    ],
  },
  comisiones: {
    titulo: 'Comisiones y Facturación',
    parrafos: [
      'Klikea cobra una comisión por las ventas realizadas a través de la plataforma.',
      'El comercio es responsable de facturar sus productos y de sus obligaciones tributarias.',
      'Klikea recauda los pagos y luego liquida al comercio el monto correspondiente, descontando la comisión y los cargos aplicables (por ejemplo, devoluciones o envíos gratuitos).',
    ],
  },
  suspension: {
    titulo: 'Inhabilitación o Suspensión de cuenta',
    parrafos: [
      'Klikea puede suspender o dar de baja una cuenta de comercio ante incumplimientos: no entregar pedidos a tiempo, productos que no coinciden con lo publicado, incumplir garantías, conductas fraudulentas o datos falsos.',
      'Al suspender un comercio, sus productos se retiran de la plataforma. La notificación se envía por correo.',
      'Las cuentas de compradores también pueden suspenderse por incumplimientos repetidos, conductas dañinas o uso indebido.',
    ],
  },
  marketing: {
    titulo: 'Marketing y Publicidad',
    parrafos: [
      'Klikea puede ofrecer a los comercios afiliados espacios y campañas de promoción dentro de la plataforma (destacados, banners, campañas de temporada).',
      'Si te interesa promocionar tu tienda o productos, escribinos por nuestros canales de contacto.',
    ],
  },
};

export interface FooterLink {
  slug?: string; // ruta /tienda/info/:slug
  label: string;
  externalUrl?: string; // para "Vende en Klikea" (WhatsApp)
}

export const FOOTER_CLIENTES: FooterLink[] = [
  { slug: 'terminos-cliente', label: 'Términos y condiciones' },
  { slug: 'envios', label: 'Envíos' },
  { slug: 'puntos-recojo', label: 'Puntos de recojo' },
  { slug: 'cambios-devoluciones', label: 'Cambios y devoluciones' },
  { slug: 'garantias', label: 'Garantías' },
  { slug: 'reclamos', label: 'Reclamos' },
  { slug: 'metodos-pago', label: 'Métodos de pago' },
  { slug: 'contacto', label: 'Contáctanos' },
];

export const FOOTER_VENDEDORES: FooterLink[] = [
  { label: 'Vende en Klikea', externalUrl: CONTACTO.whatsappUrl },
  { slug: 'terminos-comercio', label: 'Términos y Condiciones' },
  { slug: 'comisiones', label: 'Comisiones y Facturación' },
  { slug: 'suspension', label: 'Inhabilitación o Suspensión de cuenta' },
  { slug: 'marketing', label: 'Marketing y Publicidad' },
];
