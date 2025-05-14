"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { getAllCarouselSlides, saveCarouselSlide, deleteCarouselSlide, backupData, type CarouselSlide } from "@/lib/db"

export default function CarouselAdminPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: number; status: "pending" | "success" | "error" } | null>(null)

  // Função para carregar slides
  const loadSlides = async () => {
    try {
      setIsLoading(true)
      const slidesList = await getAllCarouselSlides()
      setSlides(slidesList)
    } catch (error) {
      console.error("Erro ao carregar slides:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar slides na montagem do componente
  useEffect(() => {
    loadSlides()
  }, [])

  const handleEditSlide = (slide: CarouselSlide) => {
    setEditingSlide({ ...slide })
    setIsModalOpen(true)
  }

  const handleAddSlide = () => {
    // Encontrar o maior ID e ordem para o novo slide
    const maxId = slides.length > 0 ? Math.max(...slides.map((s) => s.id)) : 0
    const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) : 0

    setEditingSlide({
      id: maxId + 1,
      image: "",
      title: "",
      subtitle: "",
      order: maxOrder + 1,
      active: true,
    })
    setIsModalOpen(true)
  }

  const handleDeleteSlide = async (id: number) => {
    console.log(`[DEBUG] Iniciando exclusão do slide ${id}`)
    if (confirm("Tem certeza que deseja excluir este slide?")) {
      try {
        console.log(`[DEBUG] Confirmação aceita, definindo status como pending`)
        setDeleteStatus({ id, status: "pending" })
        
        console.log(`[DEBUG] Chamando deleteCarouselSlide(${id})`)
        const resultado = await deleteCarouselSlide(id)
        console.log(`[DEBUG] Resultado da exclusão:`, resultado)

        // Atualizar a lista de slides após excluir
        console.log(`[DEBUG] Recarregando lista de slides`)
        await loadSlides()
        console.log(`[DEBUG] Lista de slides recarregada`)
        
        setDeleteStatus({ id, status: "success" })

        // Fazer backup após exclusão
        console.log(`[DEBUG] Iniciando backup de dados`)
        await backupData()
        console.log(`[DEBUG] Backup concluído`)
        
        alert("Slide excluído com sucesso!")
      } catch (error) {
        console.error("[DEBUG] Erro ao excluir slide:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir slide. Tente novamente.")
      }
    } else {
      console.log(`[DEBUG] Exclusão cancelada pelo usuário`)
    }
  }

  const handleSaveSlide = async () => {
    if (!editingSlide) return

    try {
      await saveCarouselSlide(editingSlide)

      // Atualizar a lista de slides após salvar
      await loadSlides()
      setIsModalOpen(false)

      // Fazer backup após salvar
      await backupData()
    } catch (error) {
      console.error("Erro ao salvar slide:", error)
      alert("Erro ao salvar slide. Tente novamente.")
    }
  }

  const handleToggleActive = async (slide: CarouselSlide) => {
    try {
      const updatedSlide = { ...slide, active: !slide.active }
      await saveCarouselSlide(updatedSlide)
      await loadSlides()
      await backupData()
    } catch (error) {
      console.error("Erro ao atualizar status do slide:", error)
      alert("Erro ao atualizar status do slide. Tente novamente.")
    }
  }

  const handleMoveUp = async (slide: CarouselSlide) => {
    // Encontrar o slide anterior na ordem
    const prevSlide = slides.filter((s) => s.order < slide.order).sort((a, b) => b.order - a.order)[0]

    if (!prevSlide) return // Já está no topo

    try {
      // Trocar as ordens
      const updatedSlide = { ...slide, order: prevSlide.order }
      const updatedPrevSlide = { ...prevSlide, order: slide.order }

      await saveCarouselSlide(updatedSlide)
      await saveCarouselSlide(updatedPrevSlide)

      await loadSlides()
      await backupData()
    } catch (error) {
      console.error("Erro ao mover slide para cima:", error)
      alert("Erro ao reordenar slides. Tente novamente.")
    }
  }

  const handleMoveDown = async (slide: CarouselSlide) => {
    // Encontrar o próximo slide na ordem
    const nextSlide = slides.filter((s) => s.order > slide.order).sort((a, b) => a.order - b.order)[0]

    if (!nextSlide) return // Já está no final

    try {
      // Trocar as ordens
      const updatedSlide = { ...slide, order: nextSlide.order }
      const updatedNextSlide = { ...nextSlide, order: slide.order }

      await saveCarouselSlide(updatedSlide)
      await saveCarouselSlide(updatedNextSlide)

      await loadSlides()
      await backupData()
    } catch (error) {
      console.error("Erro ao mover slide para baixo:", error)
      alert("Erro ao reordenar slides. Tente novamente.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Carrossel</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Carrossel</h1>
          </div>
          <div className="flex items-center flex-wrap">
            <button
              onClick={handleAddSlide}
              className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Novo Slide
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Slides do Carrossel</h2>
          <p className="text-sm text-gray-600 mb-4">
            As imagens são exibidas por completo (sem cortes) no carrossel da página inicial.
          </p>

          {slides.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum slide cadastrado. Clique em "Novo Slide" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {slides.map((slide) => (
                <div key={slide.id} className="border rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-32 relative bg-purple-100">
                      <Image
                        src={slide.image || "/placeholder.svg"}
                        alt={slide.title || "Slide"}
                        fill
                        className="object-contain"
                      />
                      {!slide.active && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-medium">Inativo</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{slide.title || "Sem título"}</h3>
                          <p className="text-sm text-gray-500">{slide.subtitle || "Sem subtítulo"}</p>
                          <p className="text-xs text-gray-400 mt-1">Ordem: {slide.order}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleToggleActive(slide)}
                            className={`p-2 rounded-full ${
                              slide.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                            title={slide.active ? "Desativar slide" : "Ativar slide"}
                          >
                            {slide.active ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>

                          <button
                            onClick={() => handleMoveUp(slide)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-full"
                            title="Mover para cima"
                            disabled={slides.filter((s) => s.order < slide.order).length === 0}
                          >
                            <ArrowUp size={18} />
                          </button>

                          <button
                            onClick={() => handleMoveDown(slide)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-full"
                            title="Mover para baixo"
                            disabled={slides.filter((s) => s.order > slide.order).length === 0}
                          >
                            <ArrowDown size={18} />
                          </button>

                          <button
                            onClick={() => handleEditSlide(slide)}
                            className="p-2 bg-purple-100 text-purple-700 rounded-full"
                            title="Editar slide"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-full"
                            title="Excluir slide"
                            disabled={deleteStatus?.id === slide.id && deleteStatus.status === "pending"}
                          >
                            {deleteStatus?.id === slide.id && deleteStatus.status === "pending" ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Slide Modal */}
      {isModalOpen && editingSlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-purple-900">
                {slides.some((s) => s.id === editingSlide.id) ? "Editar Slide" : "Novo Slide"}
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Título do slide (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={editingSlide.subtitle}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Subtítulo do slide (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={editingSlide.image}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="URL da imagem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number"
                  value={editingSlide.order}
                  onChange={(e) => setEditingSlide({ ...editingSlide, order: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ordem do slide"
                  min="1"
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingSlide.active}
                  onChange={(e) => setEditingSlide({ ...editingSlide, active: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Slide ativo
                </label>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500">Prévia da imagem:</p>
                <div className="mt-2 relative h-40 bg-purple-100 rounded">
                  {editingSlide.image ? (
                    <Image
                      src={editingSlide.image || "/placeholder.svg"}
                      alt="Prévia do slide"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">Sem imagem</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSlide}
                className="px-4 py-2 bg-purple-700 text-white rounded-md flex items-center"
              >
                <Save size={18} className="mr-1" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
