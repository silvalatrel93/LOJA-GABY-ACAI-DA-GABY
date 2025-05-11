import HamburgerMenuButton from "./hamburger-menu-button"

interface StoreHeaderProps {
  name: string
  logoUrl?: string
}

export default function StoreHeader({ name, logoUrl }: StoreHeaderProps) {
  const storeConfig = {
    name: name,
    logoUrl: logoUrl,
  }
  return (
    <div className="bg-white py-3 px-4 shadow-sm">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-4">
        <div className="flex items-center">
          <HamburgerMenuButton />
          <div className="flex items-center ml-2">
            {storeConfig?.logoUrl && (
              <div className="mr-3">
                <img
                  src={storeConfig.logoUrl || "/placeholder.svg"}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-xl font-bold text-purple-900">{storeConfig?.name || "Açaí Online"}</h1>
          </div>
        </div>
        {/* Removido o botão de carrinho que estava aqui */}
      </div>
    </div>
  )
}
