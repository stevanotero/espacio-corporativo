import MenuLateral from "@/components/layout/MenuLateral";

// Layout del panel: todas las páginas dentro de la carpeta (panel) llevan el menú lateral.
// Los paréntesis en "(panel)" hacen que esa palabra NO aparezca en la URL.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MenuLateral />
      <div className="ml-[260px]">{children}</div>
    </div>
  );
}
