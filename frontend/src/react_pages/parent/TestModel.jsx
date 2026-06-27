"use client";

import React, { useState } from 'react';
import { analyzeMealImage } from '../../api/meal.api';

export default function TestModel() {
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!photo) {
            setError("Please upload an image of a food plate first.");
            return;
        }

        // Log upload details (Task 3)
        console.log(`[Frontend] Image Name: ${photo.name}`);
        console.log(`[Frontend] Image Size: ${photo.size} bytes`);
        console.log("[Frontend] Inference Started");

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', photo);

            const res = await analyzeMealImage(formData);
            if (res && res.success && res.data) {
                console.log("[Frontend] Inference Completed");
                console.log("[Frontend] Prediction Returned:", JSON.stringify(res.data));
                setResult(res.data);
            } else {
                throw new Error("Invalid response received from the server");
            }
        } catch (err) {
            console.error("Analysis failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to analyze image using the food recognition model.");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setPhoto(null);
        setPreview(null);
        setResult(null);
        setError('');
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 space-y-2">
                    <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10">
                        AI Diagnostics Laboratory
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight">Food Recognition Model Playground</h1>
                    <p className="text-blue-100 max-w-2xl text-sm md:text-base">
                        Test the newly integrated <code className="bg-black/25 px-2 py-0.5 rounded font-mono text-sm font-bold text-white">BinhQuocNguyen/food-recognition-model</code>. Upload a plate image to retrieve detected foods, model confidence ratings, portion estimates, and detailed nutritional breakdowns.
                    </p>
                </div>
            </div>

            {/* Model Info Alert */}
            <div className="p-4 bg-blue-50 dark:bg-slate-900/50 border border-blue-200 dark:border-slate-800 rounded-2xl flex gap-3 text-sm text-blue-900 dark:text-blue-300">
                <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                <div>
                    <h3 className="font-bold uppercase tracking-wider text-xs">Pipeline Mechanism</h3>
                    <p className="mt-1 leading-relaxed text-xs">
                        This test playground runs plate images through our multi-stage pipeline: Local Hugging Face ViT classifier checks for Food-101 Western dishes. If confidence is low or an Indian plate is recognized, the system triggers our Google Gemini 2.5 Flash Vision parser, or falls back to rule-based pediatric plate defaults.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Upload Panel */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[350px]">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">cloud_upload</span>
                            Upload Plate
                        </h2>

                        <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/10 transition-colors relative min-h-[220px] overflow-hidden">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                            
                            {preview ? (
                                <div className="relative w-full h-full min-h-[160px] z-30 flex flex-col items-center justify-center">
                                    <img src={preview} alt="Uploaded Plate preview" className="max-w-full max-h-40 object-contain rounded-xl shadow-md border border-gray-200 dark:border-slate-850" />
                                    <p className="mt-3 text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        Ready for evaluation
                                    </p>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <span className="material-symbols-outlined text-gray-300 dark:text-slate-700 text-5xl mb-3">image</span>
                                    <p className="text-sm font-bold">Select meal image</p>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Drag & drop or click</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        {preview && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm transition"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={loading || !photo}
                            className={`flex-1 py-3 px-4 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 ${
                                loading || !photo 
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary text-white hover:bg-primary-dark shadow-md'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">psychology</span>
                                    Analyze Plate
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm min-h-[350px]">
                    <h2 className="text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        Analysis Output
                    </h2>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 border-4 border-blue-200 dark:border-slate-850 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest animate-pulse font-black text-center">
                                running hugging face transformer...<br/>
                                <span className="text-[10px] font-normal text-gray-400">evaluating model confidence metrics</span>
                            </p>
                        </div>
                    )}

                    {!loading && !result && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-slate-600">
                            <span className="material-symbols-outlined text-6xl mb-2">dashboard_customize</span>
                            <p className="text-sm font-bold">No data compiled yet</p>
                            <p className="text-xs">Upload an image and run analysis to populate results.</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Foods and Confidence list */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Detected Food Categories</h3>
                                <div className="space-y-3">
                                    {result.foods && result.foods.map((food, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center font-bold">🍳</span>
                                                <div>
                                                    <p className="text-sm font-extrabold capitalize text-gray-800 dark:text-white">{food.name}</p>
                                                    <p className="text-xs text-gray-500 font-bold uppercase">Portion: {food.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-100/60 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full font-black">
                                                    Confidence: {Math.round(food.confidence * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nutrition Engine Output Grid */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pediatric Nutrition Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-red-500 font-black uppercase">Calories</p>
                                        <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{result.totals?.calories || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">kcal</p>
                                    </div>
                                    <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-orange-500 font-black uppercase">Protein</p>
                                        <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">{result.totals?.protein || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">grams</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-emerald-500 font-black uppercase">Carbohydrates</p>
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{result.totals?.carbs || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">grams</p>
                                    </div>
                                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-indigo-500 font-black uppercase">Fats</p>
                                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{result.totals?.fat || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">grams</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-yellow-600 font-black uppercase">Fiber</p>
                                        <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{result.totals?.fiber || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">grams</p>
                                    </div>
                                    <div className="p-4 bg-pink-50/50 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-pink-500 font-black uppercase">Iron</p>
                                        <p className="text-xl font-black text-pink-600 dark:text-pink-400 mt-1">{result.totals?.iron || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">mg</p>
                                    </div>
                                    <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-purple-500 font-black uppercase">Calcium</p>
                                        <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{result.totals?.calcium || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">mg</p>
                                    </div>
                                    <div className="p-4 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-950/20 rounded-2xl text-center">
                                        <p className="text-[10px] text-teal-500 font-black uppercase">Vitamin C</p>
                                        <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">{result.totals?.vitaminC || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">mg</p>
                                    </div>
                                </div>
                            </div>

                            {/* Raw Model Output & Top Predictions (Task 4) */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Raw Model Predictions</h3>
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/20 border border-gray-150 dark:border-slate-800 rounded-2xl space-y-2">
                                    {result.raw_predictions && result.raw_predictions.map((pred, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 capitalize">{idx + 1}. {pred.label.replace('_', ' ')}</span>
                                            <span className="font-mono bg-gray-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-gray-600 dark:text-gray-400 font-bold">
                                                {(pred.score * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Raw Model JSON Output (Task 4) */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Raw Model JSON Output</h3>
                                <pre className="p-4 bg-gray-950 text-green-400 rounded-2xl overflow-x-auto text-xs font-mono max-h-60 border border-slate-800">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
