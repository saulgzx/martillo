export type PublicLot = {
  id: string;
  title: string;
  basePrice: number;
  status: 'PUBLISHED' | 'ACTIVE' | 'ADJUDICATED';
  imageUrl: string;
  description: string;
};

export type PublicAuction = {
  id: string;
  title: string;
  date: string;
  status: 'PUBLISHED' | 'LIVE';
  terms: string;
  lots: PublicLot[];
};

export const mockAuctions: PublicAuction[] = [
  {
    id: 'remate-001',
    title: 'Remate de Arte y Coleccion',
    date: '2026-03-10T19:00:00.000Z',
    status: 'PUBLISHED',
    terms: 'Participacion sujeta a aprobacion previa y terminos del remate.',
    lots: [
      {
        id: 'lot-001',
        title: 'Oleografiado Siglo XIX',
        basePrice: 250000,
        status: 'PUBLISHED',
        imageUrl: '/brand/martillo_icon.svg',
        description: 'Pieza en marco restaurado.',
      },
      {
        id: 'lot-002',
        title: 'Camara Vintage 1950',
        basePrice: 180000,
        status: 'PUBLISHED',
        imageUrl: '/brand/martillo_icon.svg',
        description: 'Equipo funcional con estuche.',
      },
    ],
  },
  {
    id: 'remate-002',
    title: 'Remate en Vivo - Tecnologia Clasica',
    date: '2026-03-12T22:00:00.000Z',
    status: 'LIVE',
    terms: 'Pujas online y presenciales en simultaneo.',
    lots: [
      {
        id: 'lot-003',
        title: 'Consola Retro Edicion Especial',
        basePrice: 420000,
        status: 'ACTIVE',
        imageUrl: '/brand/martillo_icon.svg',
        description: 'Incluye accesorios y caja original.',
      },
    ],
  },
];
