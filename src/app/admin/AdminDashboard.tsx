"use client";

import { useState } from "react";
import { brands, categories, formatPrice } from "@/lib/data";
import { saveProduct, deleteProduct, adminLogout } from "./actions";
import type { Product } from "@/lib/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface AdminDashboardProps {
  initialProducts: Product[];
}

export default function AdminDashboard({ initialProducts }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"products" | "sliders">("products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Slide list from Convex
  const slides = useQuery(api.slides.list) || [];
  
  // Slide Mutations
  const addSlideMutation = useMutation(api.slides.add);
  const updateSlideMutation = useMutation(api.slides.update);
  const deleteSlideMutation = useMutation(api.slides.deleteSlide);
  const seedSlidesMutation = useMutation(api.slides.seed);

  // Product Form state
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
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [newFeature, setNewFeature] = useState("");

  // Slide Form state
  const [isSlideFormOpen, setIsSlideFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [slideImage, setSlideImage] = useState("");
  const [slideEyebrow, setSlideEyebrow] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideCtaLabel, setSlideCtaLabel] = useState("");
  const [slideCtaHref, setSlideCtaHref] = useState("");
  const [slideOrder, setSlideOrder] = useState(1);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Slide actions
  const handleAddNewSlide = () => {
    setEditingSlide(null);
    setSlideImage("");
    setSlideEyebrow("");
    setSlideTitle("");
    setSlideSubtitle("");
    setSlideCtaLabel("");
    setSlideCtaHref("");
    setSlideOrder(slides.length + 1);
    setIsSlideFormOpen(true);
  };

  const handleEditSlide = (slide: any) => {
    setEditingSlide(slide);
    setSlideImage(slide.image);
    setSlideEyebrow(slide.eyebrow);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideCtaLabel(slide.ctaLabel);
    setSlideCtaHref(slide.ctaHref);
    setSlideOrder(slide.order || 1);
    setIsSlideFormOpen(true);
  };

  const handleDeleteSlide = async (id: any) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този слайдер?")) return;
    try {
      await deleteSlideMutation({ id });
      setSuccess("Слайдерът е изтрит успешно.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Грешка при изтриване на слайдера.");
    }
  };

  const handleResetSlides = async () => {
    if (!confirm("Внимание! Това ще изтрие всички потребителски слайдери и ще възстанови началните 3 слайдера на сайта. Желаете ли да продължите?")) return;
    try {
      await seedSlidesMutation({});
      setSuccess("Слайдерите са възстановени успешно.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Грешка при нулиране на слайдерите.");
    }
  };

  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingSlide) {
        await updateSlideMutation({
          id: editingSlide._id,
          image: slideImage,
          eyebrow: slideEyebrow,
          title: slideTitle,
          subtitle: slideSubtitle,
          ctaLabel: slideCtaLabel,
          ctaHref: slideCtaHref,
          order: Number(slideOrder),
        });
        setSuccess("Слайдерът е обновен успешно.");
      } else {
        await addSlideMutation({
          image: slideImage,
          eyebrow: slideEyebrow,
          title: slideTitle,
          subtitle: slideSubtitle,
          ctaLabel: slideCtaLabel,
          ctaHref: slideCtaHref,
          order: Number(slideOrder),
        });
        setSuccess("Слайдерът е добавен успешно.");
      }
      setIsSlideFormOpen(false);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Грешка при записване на слайдера.");
    } finally {
      setIsSaving(false);
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
    const bObj = brands.find(b => b.slug === p.brand);
    const cObj = categories.find(c => c.slug === p.category);
    const searchLower = search.toLowerCase().trim();
    
    const matchesSearch = !searchLower ||
      p.name.toLowerCase().includes(searchLower) ||
      (p.model && p.model.toLowerCase().includes(searchLower)) ||
      (bObj && bObj.name.toLowerCase().includes(searchLower)) ||
      (cObj && cObj.shortName.toLowerCase().includes(searchLower)) ||
      (cObj && cObj.name.toLowerCase().includes(searchLower)) ||
      p.brand.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower);

    const matchesBrand = filterBrand === "all" || p.brand === filterBrand;
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Административен панел
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Управление на продукти и начални слайдери за Кейсове.нет
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "products" ? (
              <button
                onClick={handleAddNew}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                + Нов продукт
              </button>
            ) : (
              <button
                onClick={handleAddNewSlide}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                + Нов слайд
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Изход
            </button>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-8 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Управление на Продукти
          </button>
          <button
            onClick={() => setActiveTab("sliders")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "sliders"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Банери / Слайдери
          </button>
        </div>

        {/* Feedback Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1 border border-slate-200 bg-white shadow-sm rounded-2xl p-5 h-fit space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Филтри</h2>
              
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Търсене</label>
                <input
                  type="text"
                  placeholder="Име или модел..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Марка</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="all">Всички марки</option>
                  {brands.map(b => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Категория</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="all">Всички категории</option>
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.shortName}</option>
                  ))}
                </select>
              </div>
              
              {/* Stats */}
              <div className="pt-2 text-xs text-slate-500 flex justify-between items-center">
                <span>Намерени продукти:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full">{filteredProducts.length}</span>
              </div>
            </aside>

            {/* Product List */}
            <main className="lg:col-span-3">
              <div className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="p-4 font-bold text-slate-500">Снимка</th>
                        <th className="p-4 font-bold text-slate-500">Име</th>
                        <th className="p-4 font-bold text-slate-500">Марка/Модел</th>
                        <th className="p-4 font-bold text-slate-500">Категория</th>
                        <th className="p-4 font-bold text-slate-500">Цена</th>
                        <th className="p-4 font-bold text-slate-500 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Няма намерени продукти.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const bObj = brands.find(b => b.slug === p.brand);
                          const cObj = categories.find(c => c.slug === p.category);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4">
                                <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center relative border border-slate-200">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-900 max-w-[240px] truncate" title={p.name}>
                                {p.name}
                              </td>
                              <td className="p-4 text-slate-600">
                                <span className="text-slate-900 font-semibold">{bObj?.name || p.brand}</span>
                                <span className="block text-xs text-slate-500">{p.model}</span>
                              </td>
                              <td className="p-4 text-slate-600">
                                {cObj?.shortName || p.category}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  {p.oldPrice && (
                                    <span className="text-xs text-rose-500 line-through">
                                      {formatPrice(p.oldPrice)}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-slate-950">
                                    {formatPrice(p.price)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  Редактирай
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id, p.name)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
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
        )}

        {/* SLIDERS TAB */}
        {activeTab === "sliders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Управление на слайдерите на началната страница
              </h2>
              <button
                onClick={handleResetSlides}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer"
              >
                Нулирай до началните слайдове
              </button>
            </div>

            {slides.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl">
                <p className="text-slate-500 text-sm">Няма конфигурирани слайдери. Използвайте бутона "Нов слайд" или нулирайте системата.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((s: any) => (
                  <div key={s._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                    <div className="h-44 relative bg-slate-100 flex items-center justify-center border-b border-slate-100">
                      <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ред: {s.order}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-lime bg-slate-100 px-2.5 py-0.5 rounded-full block w-fit">
                          {s.eyebrow}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{s.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{s.subtitle}</p>
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                          <p><strong>Бутон:</strong> {s.ctaLabel}</p>
                          <p className="truncate"><strong>Линк:</strong> {s.ctaHref}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleEditSlide(s)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(s._id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Изтрий
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for Product Add / Edit */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Редактиране на продукт" : "Добавяне на нов продукт"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
                {/* 1. IMAGE URL INPUT */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Добавяне на линк към снимка *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Въведете URL на снимка (напр. /images/case-black-silicone.png или https://...)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          if (!selectedGallery.includes(imageUrlInput.trim())) {
                            setSelectedGallery([...selectedGallery, imageUrlInput.trim()]);
                          }
                          setImageUrlInput("");
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 font-semibold text-sm hover:brightness-110 shadow-lg active:scale-95 transition-all text-white cursor-pointer"
                    >
                      Добави снимка
                    </button>
                  </div>
                </div>

                {/* 2. SELECTED GALLERY REORDER */}
                {selectedGallery.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Подреждане на снимките (Първата е основна. Влачете, за да пренаредите)
                    </label>
                    <div className="flex flex-wrap gap-4 border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
                      {selectedGallery.map((imgUrl, index) => (
                        <div
                          key={imgUrl}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="relative w-24 h-24 rounded-lg bg-white border border-slate-200 group overflow-hidden flex items-center justify-center cursor-move select-none"
                        >
                          <img src={imgUrl} alt="product photo" className="w-full h-full object-cover" />
                          
                          {/* Drag handle dots */}
                          <div className="absolute top-1 left-1 bg-white/90 rounded border border-slate-200 p-0.5 opacity-80 group-hover:opacity-100 cursor-grab flex flex-col gap-0.5">
                            <span className="text-[10px] leading-[3px] text-slate-500 font-extrabold">⋮⋮</span>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setSelectedGallery(selectedGallery.filter(url => url !== imgUrl))}
                            className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Заглавие на продукта *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="напр. Силиконов кейс с държач за карти за iPhone 15 Pro..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>

                  {/* Brand Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Марка *</label>
                    <select
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    >
                      {brands.map(b => (
                        <option key={b.slug} value={b.slug}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Категория *</label>
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    >
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Модел на телефон</label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="напр. iPhone 15 Pro (оставете празно, ако е универсален)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    />
                  </div>

                  {/* Badge */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Бадж (Етикет)</label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    >
                      <option value="">Без бадж</option>
                      <option value="Ново">Ново</option>
                      <option value="Хит">Хит</option>
                      <option value="Топ оферта">Топ оферта</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Цена (в EUR €) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={formPrice || ""}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      placeholder="напр. 19.99"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Редовна цена преди намаление (в EUR €)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formOldPrice}
                      onChange={(e) => setFormOldPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="напр. 29.99 (оставете празно, ако не е намален)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Описание *</label>
                  <textarea
                     required
                     rows={4}
                     value={formDescription}
                     onChange={(e) => setFormDescription(e.target.value)}
                     placeholder="Подробно описание на продукта..."
                     className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all resize-y"
                  />
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Основни характеристики на продукта</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="напр. Удароустойчив термопластичен полиуретан"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-sm hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                    >
                      Добави
                    </button>
                  </div>

                  {formFeatures.length > 0 && (
                    <ul className="space-y-1.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      {formFeatures.map((feat, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                          <span>• {feat}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                          >
                            Премахни
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving ? "Запис..." : "Запази продукт"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Slide Add / Edit */}
        {isSlideFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSlide ? "Редактиране на слайдер" : "Добавяне на нов слайдер"}
                </h3>
                <button
                  onClick={() => setIsSlideFormOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSlideSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Снимка (Линк към файл) *</label>
                  <input
                    type="text"
                    required
                    value={slideImage}
                    onChange={(e) => setSlideImage(e.target.value)}
                    placeholder="напр. /images/hero-lifestyle.webp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Eyebrow */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Малко надзаглавие *</label>
                    <input
                      type="text"
                      required
                      value={slideEyebrow}
                      onChange={(e) => setSlideEyebrow(e.target.value)}
                      placeholder="напр. Нова колекция"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>

                  {/* Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Пореден номер на слайд (число) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={slideOrder}
                      onChange={(e) => setSlideOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Главно заглавие *</label>
                  <input
                    type="text"
                    required
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="напр. Калъфи за всеки телефон, всеки стил"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Подзаглавие (описание) *</label>
                  <textarea
                    required
                    rows={3}
                    value={slideSubtitle}
                    onChange={(e) => setSlideSubtitle(e.target.value)}
                    placeholder="Въведете кратко описание към банера..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* CTA Label */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Текст на бутона *</label>
                    <input
                      type="text"
                      required
                      value={slideCtaLabel}
                      onChange={(e) => setSlideCtaLabel(e.target.value)}
                      placeholder="напр. Пазарувай калъфи"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>

                  {/* CTA Href */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Линк на бутона (CTA линк) *</label>
                    <input
                      type="text"
                      required
                      value={slideCtaHref}
                      onChange={(e) => setSlideCtaHref(e.target.value)}
                      placeholder="напр. /shop?category=silicone-cases"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsSlideFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:brightness-110 shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving ? "Запис..." : "Запази слайдер"}
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
