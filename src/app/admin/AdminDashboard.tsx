"use client";

import { useState, useEffect } from "react";
import { brands, categories, formatPrice } from "@/lib/data";
import { saveProduct, deleteProduct, getGalleryImages, adminLogout } from "./actions";
import type { Product } from "@/lib/types";

interface AdminDashboardProps {
  initialProducts: Product[];
}

export default function AdminDashboard({ initialProducts }: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formOldPrice, setFormOldPrice] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load public folder images
  useEffect(() => {
    getGalleryImages().then(setGalleryImages).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    window.location.reload();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormBrand(product.brand);
    setFormModel(product.model || "");
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOldPrice(product.oldPrice || "");
    setFormDescription(product.description || "");
    setFormBadge(product.badge || "");
    setFormFeatures(product.features || []);
    setSelectedGallery(product.gallery || (product.image ? [product.image] : []));
    
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormName("");
    setFormBrand(brands[0]?.slug || "apple");
    setFormModel("");
    setFormCategory(categories[0]?.slug || "gsm-accessories");
    setFormPrice(0);
    setFormOldPrice("");
    setFormDescription("");
    setFormBadge("");
    setFormFeatures([]);
    setSelectedGallery([]);
    
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете продукта "${name}"?`)) return;
    
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
      setSuccess("Продуктът беше изтрит успешно.");
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(res.error || "Грешка при изтриване на продукта.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGallery.length === 0) {
      setError("Моля изберете поне една снимка за галерията на продукта.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    const res = await saveProduct({
      id: editingProduct?.id,
      name: formName,
      brand: formBrand,
      model: formModel,
      category: formCategory,
      price: formPrice,
      oldPrice: formOldPrice === "" ? undefined : Number(formOldPrice),
      description: formDescription,
      gallery: selectedGallery,
      features: formFeatures,
      badge: formBadge || undefined,
    });

    setIsSaving(false);

    if (res.success) {
      setSuccess("Продуктът беше записан успешно. Презареждане...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setError(res.error || "Възникна грешка при запис.");
    }
  };

  // Drag and drop sorting handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reordered = [...selectedGallery];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    setSelectedGallery(reordered);
  };

  const toggleGalleryImageSelection = (imgUrl: string) => {
    if (selectedGallery.includes(imgUrl)) {
      setSelectedGallery(selectedGallery.filter(url => url !== imgUrl));
    } else {
      setSelectedGallery([...selectedGallery, imgUrl]);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormFeatures([...formFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (idx: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== idx));
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.model && p.model.toLowerCase().includes(search.toLowerCase()));
    const matchesBrand = filterBrand === "all" || p.brand === filterBrand;
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#27272a] pb-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
              Административен панел
            </h1>
            <p className="text-sm text-[#a1a1aa] mt-1">
              Управление на продукти и категории за Кейсове.нет
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddNew}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-lg active:scale-95 transition-all"
            >
              + Нов продукт
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-[#27272a] bg-[#18181b] text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition-all"
            >
              Изход
            </button>
          </div>
        </header>

        {/* Feedback Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 border border-[#27272a] bg-[#18181b]/50 backdrop-blur rounded-2xl p-5 h-fit space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#27272a] pb-3">Филтри</h2>
            
            {/* Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Търсене</label>
              <input
                type="text"
                placeholder="Име или модел..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Марка</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="all">Всички марки</option>
                {brands.map(b => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Категория</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="all">Всички категории</option>
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.shortName}</option>
                ))}
              </select>
            </div>
            
            {/* Stats */}
            <div className="pt-2 text-xs text-[#a1a1aa] flex justify-between items-center">
              <span>Намерени продукти:</span>
              <span className="font-bold text-white bg-[#27272a] px-2.5 py-1 rounded-full">{filteredProducts.length}</span>
            </div>
          </aside>

          {/* Product List */}
          <main className="lg:col-span-3">
            <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#18181b]/80">
                      <th className="p-4 font-semibold text-[#a1a1aa]">Снимка</th>
                      <th className="p-4 font-semibold text-[#a1a1aa]">Име</th>
                      <th className="p-4 font-semibold text-[#a1a1aa]">Марка/Модел</th>
                      <th className="p-4 font-semibold text-[#a1a1aa]">Категория</th>
                      <th className="p-4 font-semibold text-[#a1a1aa]">Цена</th>
                      <th className="p-4 font-semibold text-[#a1a1aa] text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#a1a1aa]">
                          Няма намерени продукти.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const bObj = brands.find(b => b.slug === p.brand);
                        const cObj = categories.find(c => c.slug === p.category);
                        return (
                          <tr key={p.id} className="hover:bg-[#18181b]/40 transition-colors">
                            <td className="p-4">
                              <div className="h-12 w-12 rounded-lg bg-[#27272a] overflow-hidden flex items-center justify-center relative">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="p-4 font-medium text-white max-w-[240px] truncate" title={p.name}>
                              {p.name}
                            </td>
                            <td className="p-4 text-[#a1a1aa]">
                              <span className="text-white font-medium">{bObj?.name || p.brand}</span>
                              <span className="block text-xs">{p.model}</span>
                            </td>
                            <td className="p-4 text-[#a1a1aa]">
                              {cObj?.shortName || p.category}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                {p.oldPrice && (
                                  <span className="text-xs text-rose-400 line-through">
                                    {formatPrice(p.oldPrice)}
                                  </span>
                                )}
                                <span className="font-bold text-white">
                                  {formatPrice(p.price)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleEdit(p)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                              >
                                Редактирай
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-900/40 transition-colors"
                              >
                                Изтрий
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* Modal for Add / Edit */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#27272a] p-5">
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? "Редактиране на продукт" : "Добавяне на нов продукт"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg p-2 hover:bg-[#18181b] text-[#a1a1aa] hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 1. TOP GALLERY SELECTOR */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">
                      Избор на снимки от Галерията (Изберете множество)
                    </label>
                    <span className="text-xs text-violet-400">
                      Избрани: {selectedGallery.length} снимки
                    </span>
                  </div>
                  
                  <div className="border border-[#27272a] bg-[#18181b]/30 rounded-xl p-4 max-h-[170px] overflow-y-auto scrollbar-thin">
                    {galleryImages.length === 0 ? (
                      <p className="text-xs text-[#a1a1aa] text-center py-4">Не бяха намерени снимки в папка public/images/</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                        {galleryImages.map((imgUrl) => {
                          const isSelected = selectedGallery.includes(imgUrl);
                          return (
                            <button
                              key={imgUrl}
                              type="button"
                              onClick={() => toggleGalleryImageSelection(imgUrl)}
                              className={`relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border-2 transition-all ${
                                isSelected ? "border-violet-500 ring-2 ring-violet-500/20 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                              title={imgUrl.replace("/images/", "")}
                            >
                              <img src={imgUrl} alt="gallery" className="h-full w-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-violet-500/10 flex items-center justify-center">
                                  <span className="bg-violet-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SELECTED GALLERY REORDER (HTML5 DRAG AND DROP) */}
                {selectedGallery.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">
                      Подреждане на снимките (Първата е основна. Влачете, за да пренаредите)
                    </label>
                    <div className="flex flex-wrap gap-4 border border-[#27272a] bg-[#18181b]/50 p-4 rounded-xl">
                      {selectedGallery.map((imgUrl, index) => (
                        <div
                          key={imgUrl}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="relative w-24 h-24 rounded-lg bg-zinc-800 border border-zinc-700/80 group overflow-hidden flex items-center justify-center cursor-move select-none"
                        >
                          <img src={imgUrl} alt="product photo" className="w-full h-full object-cover" />
                          
                          {/* Drag handle dots */}
                          <div className="absolute top-1 left-1 bg-black/75 rounded p-0.5 opacity-80 group-hover:opacity-100 cursor-grab flex flex-col gap-0.5">
                            <span className="text-[10px] leading-[3px] text-zinc-400 font-bold">⋮⋮</span>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setSelectedGallery(selectedGallery.filter(url => url !== imgUrl))}
                            className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow"
                          >
                            ✕
                          </button>
                          
                          {/* Main image label */}
                          {index === 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-violet-600 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                              Главна
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. BASIC FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Заглавие на продукта *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="напр. Силиконов кейс с държач за карти за iPhone 15 Pro..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Brand Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Марка *</label>
                    <select
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {brands.map(b => (
                        <option key={b.slug} value={b.slug}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Категория *</label>
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Модел на телефон</label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="напр. iPhone 15 Pro (оставете празно, ако е универсален)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Badge */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Бадж (Етикет)</label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="">Без бадж</option>
                      <option value="Ново">Ново</option>
                      <option value="Хит">Хит</option>
                      <option value="Топ оферта">Топ оферта</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Цена (в лв.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={formPrice || ""}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      placeholder="напр. 19.99"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Редовна цена преди намаление (в лв.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formOldPrice}
                      onChange={(e) => setFormOldPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="напр. 29.99 (оставете празно, ако не е намален)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Описание *</label>
                  <textarea
                    required
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Подробно описание на продукта..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors resize-y"
                  />
                </div>

                {/* Features (Tag List) */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider block">Основни характеристики на продукта</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="напр. Удароустойчив термопластичен полиуретан"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 font-semibold text-sm hover:bg-zinc-700 transition-colors"
                    >
                      Добави
                    </button>
                  </div>

                  {formFeatures.length > 0 && (
                    <ul className="space-y-1.5 bg-[#18181b]/30 border border-[#27272a] p-4 rounded-xl">
                      {formFeatures.map((feat, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm text-[#d4d4d8] bg-[#18181b]/60 px-3 py-2 rounded-lg border border-[#27272a]">
                          <span>• {feat}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                          >
                            Премахни
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#27272a] text-sm text-[#a1a1aa] hover:text-white transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isSaving ? "Запис..." : "Запази продукт"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
