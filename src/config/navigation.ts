import { AppRole } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Package, Settings, Truck, TreePine, Wrench,
  ShieldCheck, Coffee, DollarSign, Megaphone, Award, HeartHandshake,
  ClipboardList, Stethoscope, Sprout, MessageSquare, Building2, MapPin,
  CalendarCheck, Search, Leaf
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const COOPERATIVA_NAV: NavItem[] = [
  { title: "Panel Principal", url: "/cooperativa/dashboard", icon: LayoutDashboard },
  { title: "Productoras/es", url: "/cooperativa/productores-hub", icon: Users },
  { title: "Acopio y Comercial", url: "/cooperativa/acopio", icon: Package },
  { title: "Operaciones", url: "/cooperativa/operaciones", icon: Settings },
  { title: "Finanzas", url: "/cooperativa/finanzas-hub", icon: DollarSign },
  { title: "Comunicación", url: "/cooperativa/comunicacion", icon: Megaphone },
  { title: "Nova Cup", url: "/cooperativa/calidad", icon: Coffee },
  { title: "Protocolo VITAL", url: "/cooperativa/vital", icon: HeartHandshake },
  { title: "Inclusión y Equidad", url: "/cooperativa/inclusion", icon: Award },
  { title: "Usuarios y Permisos", url: "/cooperativa/usuarios", icon: Users },
];

const EXPORTADOR_NAV: NavItem[] = [
  { title: "Panel Principal", url: "/exportador/dashboard", icon: LayoutDashboard },
  { title: "Gestión de Café", url: "/exportador/cafe", icon: Coffee },
  { title: "Red de Proveedores", url: "/exportador/socios", icon: Building2 },
  { title: "Gestión Comercial", url: "/exportador/comercial", icon: Truck },
  { title: "Nova Cup", url: "/exportador/calidad", icon: Coffee },
  { title: "Administración", url: "/exportador/admin", icon: Settings },
  { title: "Mensajes", url: "/exportador/mensajes", icon: MessageSquare },
];

const PRODUCTOR_NAV: NavItem[] = [
  { title: "Panel Principal", url: "/productor/dashboard", icon: LayoutDashboard },
  { title: "Producción", url: "/productor/produccion", icon: Sprout },
  { title: "Sanidad Vegetal", url: "/productor/sanidad", icon: Stethoscope },
  { title: "Finanzas", url: "/productor/finanzas-hub", icon: DollarSign },
  { title: "Sostenibilidad", url: "/productor/sostenibilidad", icon: Leaf },
  { title: "Comunidad", url: "/productor/comunidad", icon: Users },
];

const TECNICO_NAV: NavItem[] = [
  { title: "Panel Principal", url: "/tecnico/dashboard", icon: LayoutDashboard },
  { title: "Plan de Visitas", url: "/tecnico/visitas", icon: CalendarCheck },
  { title: "Diagnósticos", url: "/tecnico/diagnosticos", icon: Search },
  { title: "Áreas Productivas", url: "/tecnico/productores", icon: MapPin },
  { title: "Protocolo VITAL", url: "/tecnico/vital", icon: HeartHandshake },
];

const CERTIFICADORA_NAV: NavItem[] = [
  { title: "Panel Principal", url: "/certificadora/dashboard", icon: LayoutDashboard },
];

const ADMIN_NAV: NavItem[] = [
  { title: "Panel Admin", url: "/admin", icon: LayoutDashboard },
  { title: "Directorio Clientes", url: "/admin/directorio", icon: Building2 },
  { title: "Platform Admin", url: "/admin/platform", icon: Settings },
  { title: "Architect View", url: "/admin/architect", icon: ClipboardList },
];

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  cooperativa: COOPERATIVA_NAV,
  exportador: EXPORTADOR_NAV,
  productor: PRODUCTOR_NAV,
  tecnico: TECNICO_NAV,
  certificadora: CERTIFICADORA_NAV,
  admin: ADMIN_NAV,
};

export const ACCOUNT_NAV: NavItem[] = [
  { title: "Mi perfil", url: "/mi-perfil", icon: Users },
  { title: "Mi plan", url: "/mi-plan", icon: DollarSign },
  { title: "Directorio", url: "/directorio/cooperativas", icon: Building2 },
  { title: "Acerca de", url: "/acerca", icon: Leaf },
];
