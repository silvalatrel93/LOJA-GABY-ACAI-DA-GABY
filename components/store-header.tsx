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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-200 shadow-sm">
                  <img
                    src={storeConfig.logoUrl || "/placeholder.svg"}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            )}
            <h1 className="text-xl font-bold text-purple-900">{storeConfig?.name || "Heai Açai e Sorvetes"}</h1>
          </div>
        </div>
        {/* Removido o botão de carrinho que estava aqui */}
      </div>
    </div>
  )
}
