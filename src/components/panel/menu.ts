import {
  BookOpenIcon,
  CalendarRangeIcon,
  CircleHelpIcon,
  ContactIcon,
  FlaskConicalIcon,
  GalleryHorizontalEndIcon,
  HouseIcon,
  MessageSquareQuoteIcon,
  SproutIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

// Estructura del menú lateral del panel (sección 4 de la especificación).
// «Otros» (Ver el sitio, Mi cuenta, Salir) se arma aparte porque no son solo enlaces.

export type ClaveMenu =
  | "inicio"
  | "plantas"
  | "catalogos"
  | "temporadas"
  | "fertilizantes"
  | "carrusel"
  | "nosotros"
  | "preguntas"
  | "testimonios"
  | "datos";

export type ElementoMenu = {
  clave: ClaveMenu;
  ruta: string;
  icono: LucideIcon;
};

export type GrupoMenu = {
  titulo?: "grupoCatalogo" | "grupoApartados";
  elementos: ElementoMenu[];
};

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    elementos: [{ clave: "inicio", ruta: "/panel", icono: HouseIcon }],
  },
  {
    titulo: "grupoCatalogo",
    elementos: [
      { clave: "plantas", ruta: "/panel/plantas", icono: SproutIcon },
      { clave: "catalogos", ruta: "/panel/catalogos", icono: BookOpenIcon },
      { clave: "temporadas", ruta: "/panel/temporadas", icono: CalendarRangeIcon },
      { clave: "fertilizantes", ruta: "/panel/fertilizantes", icono: FlaskConicalIcon },
    ],
  },
  {
    titulo: "grupoApartados",
    elementos: [
      { clave: "carrusel", ruta: "/panel/carrusel", icono: GalleryHorizontalEndIcon },
      { clave: "nosotros", ruta: "/panel/nosotros", icono: UsersIcon },
      { clave: "preguntas", ruta: "/panel/preguntas", icono: CircleHelpIcon },
      { clave: "testimonios", ruta: "/panel/testimonios", icono: MessageSquareQuoteIcon },
      { clave: "datos", ruta: "/panel/datos-y-redes", icono: ContactIcon },
    ],
  },
];

export const RUTA_MI_CUENTA = "/panel/mi-cuenta";
