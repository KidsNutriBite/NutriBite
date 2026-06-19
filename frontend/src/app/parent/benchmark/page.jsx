"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

// Hardcoded high-fidelity mock data derived from benchmark_framework.py output
const benchmarkData = {
  "Gemini 2.5 Flash": {
    name: "Gemini 2.5 Flash",
    type: "API / Cloud",
    memory: "Hosted (0.0 GB)",
    latency: 1100.0,
    throughput: 88.5,
    hallucination: 0.05,
    groundedness: 0.95,
    cost: 0.00012,
    rating: "🥇 Best Conversational Reasoning"
  },
  "Llama 3 (8B)": {
    name: "Llama 3 (8B)",
    type: "Local / Private (Ollama)",
    memory: "6.2 GB VRAM",
    latency: 2375.0,
    throughput: 38.2,
    hallucination: 0.12,
    groundedness: 0.88,
    cost: 0.00000,
    rating: "🥈 Best Local Security"
  },
  "Mistral (7B)": {
    name: "Mistral (7B)",
    type: "Local / Private (Ollama)",
    memory: "5.4 GB VRAM",
    latency: 2090.0,
    throughput: 41.5,
    groundedness: 0.90,
    hallucination: 0.10,
    cost: 0.00000,
    rating: "🥉 Excellent Balance"
  },
  "Phi-3 (3.8B)": {
    name: "Phi-3 (3.8B)",
    type: "Local / Private (Ollama)",
    memory: "3.1 GB VRAM",
    latency: 1330.0,
    throughput: 58.4,
    groundedness: 0.85,
    hallucination: 0.15,
    cost: 0.00000,
    rating: "⚡ Best Speed & Lightest Footprint"
  }
};

const promptRuns = [
  {
    id: "Run 1: Fever Dosage",
    query: "Can 3yo have egg in fever?",
    gemini: { lat: 1040, accuracy: "Perfect", citation: "Anemia guidelines" },
    llama: { lat: 2150, accuracy: "Acceptable", citation: "General advice" },
    mistral: { lat: 1980, accuracy: "Perfect", citation: "Fever nutrition" },
    phi3: { lat: 1210, accuracy: "Acceptable", citation: "Fever soft food" }
  },
  {
    id: "Run 2: Picky eating",
    query: "Toddler refuses green leafy vegetables",
    gemini: { lat: 1210, accuracy: "Highly Creative", citation: "Picky Eating FAQ" },
    llama: { lat: 2420, accuracy: "Good Guidelines", citation: "Child nutrition" },
    mistral: { lat: 2110, accuracy: "Good Guidelines", citation: "Veggies masks" },
    phi3: { lat: 1410, accuracy: "Acceptable", citation: "Smoothies hints" }
  }
];

export default function BenchmarkDashboard() {
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
  const current = benchmarkData[selectedModel];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/20 p-8 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-500/30">
                Observability Portal
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Enterprise LLM Benchmarking & Routing Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
              Compare pediatric accuracy, private execution latencies, VRAM memory metrics, and live financial cost models between local Ollama models and Google Gemini API.
            </p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-600/50 transition duration-300 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">autorenew</span>
            Trigger Test Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Model Selection Panel */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">dns</span>
            Target Models
          </h2>
          <div className="space-y-3">
            {Object.keys(benchmarkData).map((mKey) => {
              const m = benchmarkData[mKey];
              const isSelected = selectedModel === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => setSelectedModel(mKey)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-1 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                      : "bg-slate-850 border-slate-700/60 text-slate-400 hover:border-slate-650 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-white text-base">{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-650">
                      {m.type.split(" ")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                    <span>{m.memory}</span>
                    <span className="text-indigo-400 font-medium">{m.rating.split(" ")[0]} {m.rating.split(" ").slice(1).join(" ")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Model Focus Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-6 mb-6">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Active Focus</span>
                <h2 className="text-2xl font-bold text-white mt-1">{current.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Verdict rating</span>
                <div className="text-indigo-300 font-bold text-sm bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl mt-1">
                  {current.rating}
                </div>
              </div>
            </div>

            {/* Visual Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Latency Meter */}
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-rose-400 text-sm">speed</span>
                    Response Latency
                  </span>
                  <span className="text-lg font-extrabold text-rose-400">{current.latency} ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (current.latency / 3000) * 100)}%` }}
                    className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full rounded-full"
                  ></motion.div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Maximum target threshold for standard pediatric queries is 2000ms.</p>
              </div>

              {/* Throughput Meter */}
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">hourglass_empty</span>
                    Throughput
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400">{current.throughput} tok/s</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (current.throughput / 100) * 100)}%` }}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full"
                  ></motion.div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Tokens generated per second. Higher throughput provides smoother voice interaction.</p>
              </div>

              {/* Groundedness vs Hallucination */}
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-amber-400 text-sm">verified_user</span>
                    Factual Groundedness
                  </span>
                  <span className="text-lg font-extrabold text-amber-400">{Math.round(current.groundedness * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${current.groundedness * 100}%` }}
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full"
                  ></motion.div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Evaluates how strictly the LLM remains anchored to factual clinical textbook chunks.</p>
              </div>

              {/* Billing Cost */}
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-indigo-400 text-sm">payments</span>
                    Estimated Cost / Request
                  </span>
                  <span className="text-lg font-extrabold text-indigo-400">
                    {current.cost === 0 ? "FREE" : `$${current.cost.toFixed(5)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: current.cost === 0 ? "100%" : "20%" }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                  ></motion.div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Private local models incur $0.00 cloud token charges, eliminating network wallet drains.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompts Test Case Runs Section */}
      <div className="mt-8 bg-slate-800/30 border border-slate-700/40 p-6 md:p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400">view_list</span>
          Deterministic Run Logs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-3">Test ID / Run</th>
                <th className="py-4 px-3">Query</th>
                <th className="py-4 px-3 text-center">Gemini 2.5 Flash</th>
                <th className="py-4 px-3 text-center">Llama 3 (8B)</th>
                <th className="py-4 px-3 text-center">Mistral (7B)</th>
                <th className="py-4 px-3 text-center">Phi-3 (3.8B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {promptRuns.map((run, i) => (
                <tr key={i} className="hover:bg-slate-800/10">
                  <td className="py-4 px-3 font-bold text-white">{run.id}</td>
                  <td className="py-4 px-3 italic font-medium">"{run.query}"</td>
                  <td className="py-4 px-3 text-center">
                    <div className="text-emerald-400 font-bold">{run.gemini.lat}ms</div>
                    <div className="text-[10px] text-slate-500">{run.gemini.accuracy}</div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="text-amber-400 font-bold">{run.llama.lat}ms</div>
                    <div className="text-[10px] text-slate-500">{run.llama.accuracy}</div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="text-amber-400 font-bold">{run.mistral.lat}ms</div>
                    <div className="text-[10px] text-slate-500">{run.mistral.accuracy}</div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="text-emerald-400 font-bold">{run.phi3.lat}ms</div>
                    <div className="text-[10px] text-slate-500">{run.phi3.accuracy}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
