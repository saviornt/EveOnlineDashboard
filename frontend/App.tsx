// frontend/App.tsx
// EVE Online Dashboard - Main Application Shell
// Local-first Tauri + React 19 + TypeScript implementation
// Inspired by EVE Tycoon market browser layout, adapted for multi-character local use + integrated AI assistant.
// All sensitive operations stay on the Rust backend via Tauri.

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, User, TrendingUp, Factory, ShoppingCart, Package, MessageCircle } from 'lucide-react';

// shadcn/ui style imports (adjust path if your components/ui lives elsewhere)
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { ScrollArea } from './components/ui/scroll-area';

// Types
interface Character {
  id: string;
  name: string;
  portraitUrl?: string;
  corporation?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type TabType = 'Character' | 'Analytics' | 'Industry' | 'Market' | 'Assets';

// Mock data - replace with real data loaded via Tauri commands from SurrealDB / ESI
const MOCK_CHARACTERS: Character[] = [
  { id: 'c1', name: 'JitaTrader42', corporation: 'Black Market Production', portraitUrl: undefined },
  { id: 'c2', name: 'MissionRunnerX', corporation: 'SOE Industrial', portraitUrl: undefined },
];

const MOCK_MARKET_SELLERS = [
  { region: 'The Forge', quantity: 1240, price: 124500, location: 'Jita 4-4', jumps: 0, expires: '2d 14h', lastModified: 'just now' },
  { region: 'Domain', quantity: 850, price: 119900, location: 'Amarr VIII', jumps: 12, expires: '5d 3h', lastModified: '14m ago' },
];

const MOCK_MARKET_BUYERS = [
  { region: 'The Forge', quantity: 3200, price: 118000, location: 'Jita 4-4', jumps: 0, range: 'region', minVolume: 100, expires: '1d 9h', lastModified: '3m ago' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('Market');
  const [characters, setCharacters] = useState<Character[]>(MOCK_CHARACTERS);
  const [activeCharacterId, setActiveCharacterId] = useState<string>(MOCK_CHARACTERS[0].id);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello capsuleer. I have access to your local market data, skill plans, and wallet history. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId)!;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // === Character Management ===
  const handleAddCharacter = () => {
    // TODO: Replace with real Tauri command that initiates EVE SSO + PKCE flow (Rust side)
    // Example: await invoke('start_eve_sso_flow')
    console.log('[Tauri] Initiating EVE SSO flow for new character...');
    // Temporary mock add for UI testing
    const newChar: Character = {
      id: `c${Date.now()}`,
      name: `NewCapsuleer${Math.floor(Math.random() * 100)}`,
      corporation: 'Independent',
    };
    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacterId(newChar.id);
  };

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    // TODO: Load character-specific data from Rust backend / SurrealDB
  };

  // === Chatbot (Local AI) ===
  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Mock AI response - replace with real Tauri invoke to Rust llama.cpp / RAG pipeline
    setTimeout(() => {
      let response = 'Understood. I am analyzing your local data...';
      if (trimmed.toLowerCase().includes('market') || trimmed.toLowerCase().includes('price')) {
        response = `Current Jita 4-4 best sell for the item you referenced is approximately 124,500 ISK with strong volume. Would you like me to run a full margin analysis across nearby hubs?`;
      } else if (trimmed.toLowerCase().includes('skill') || trimmed.toLowerCase().includes('train')) {
        response = `Your current skill queue completes in 3 days 17 hours. I recommend injecting Cybernetics V next for implant slot efficiency.`;
      } else {
        response = `I have cross-referenced your wallet, assets, and recent industry jobs. Everything looks stable. Need a specific optimization recommendation?`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsChatLoading(false);
    }, 850);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // === Dynamic Left Toolbar Content ===
  const renderLeftToolbar = () => {
    switch (activeTab) {
      case 'Market':
        return (
          <div className="space-y-6 p-4 text-sm">
            <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium">Hide filters</Button>

            {/* Price Filter */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <input type="checkbox" className="accent-teal-500" /> Price
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="0" className="bg-zinc-950 border-zinc-800" />
                <Input placeholder="1000000" className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>

            {/* Quantity Filter */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <input type="checkbox" className="accent-teal-500" /> Quantity
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="0" className="bg-zinc-950 border-zinc-800" />
                <Input placeholder="1000000" className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>

            {/* Jumps */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <input type="checkbox" className="accent-teal-500" /> Jumps
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="0" className="bg-zinc-950 border-zinc-800" />
                <Input placeholder="100" className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 text-zinc-400 mb-2">
                <input type="checkbox" className="accent-teal-500" /> Show Entered Quantity
              </label>
            </div>

            {/* Security Exclude */}
            <div>
              <div className="text-zinc-400 mb-2">Exclude</div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-red-500" /> Null Sec</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-orange-500" /> Low Sec</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> High Sec</label>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <Input placeholder="Location name (regex)" className="bg-zinc-950 border-zinc-800" />
              <Input placeholder="Region name (regex)" className="bg-zinc-950 border-zinc-800" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-500" /> Market Hubs Only</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-500" /> NPC Orders Only</label>
              <label className="flex items-center gap-2 text-sm text-zinc-500"><input type="checkbox" disabled className="accent-teal-500" /> My Orders Only (login required)</label>
            </div>
          </div>
        );

      case 'Character':
        return (
          <div className="p-4 space-y-2 text-sm">
            <div className="font-medium text-zinc-400 mb-2">Character Tools</div>
            {['Overview', 'Skill Queue', 'Wallet & Journal', 'Implants & Clones', 'Current Ship & Location', 'Fatigue & Jump Fatigue'].map((item) => (
              <div key={item} className="px-3 py-2 rounded hover:bg-zinc-900 cursor-pointer text-zinc-300">{item}</div>
            ))}
            <div className="pt-4 border-t border-zinc-800">
              <Button variant="outline" className="w-full">Force ESI Sync</Button>
            </div>
          </div>
        );

      case 'Analytics':
        return (
          <div className="p-4 text-sm space-y-2">
            <div className="font-medium text-zinc-400 mb-2">Analysis Views</div>
            {['Profit Overview', 'Trade History', 'Market Trends', 'Wallet Delta', 'Industry Efficiency'].map((item) => (
              <div key={item} className="px-3 py-2 rounded hover:bg-zinc-900 cursor-pointer">{item}</div>
            ))}
          </div>
        );

      case 'Industry':
        return (
          <div className="p-4 text-sm space-y-2">
            <div className="font-medium text-zinc-400 mb-2">Industry</div>
            {['Active Jobs', 'Blueprint Library', 'Manufacturing Profits', 'Reaction Plans', 'Planetary Colonies'].map((item) => (
              <div key={item} className="px-3 py-2 rounded hover:bg-zinc-900 cursor-pointer">{item}</div>
            ))}
          </div>
        );

      case 'Assets':
        return (
          <div className="p-4 text-sm space-y-2">
            <div className="font-medium text-zinc-400 mb-2">Asset Management</div>
            {['All Assets', 'By Location', 'High Value Items', 'Containers', 'Contracts'].map((item) => (
              <div key={item} className="px-3 py-2 rounded hover:bg-zinc-900 cursor-pointer">{item}</div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // === Main Content per Tab ===
  const renderMainContent = () => {
    switch (activeTab) {
      case 'Market':
        return (
          <div className="flex flex-col h-full">
            {/* Item Search Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <div className="flex-1">
                <Input placeholder="Item name" className="bg-zinc-950 border-zinc-800 text-lg" />
              </div>
              <Button variant="ghost" className="text-zinc-400">Clear search</Button>
            </div>

            {/* Item Selection Placeholder (matching EVE Tycoon style) */}
            <div className="flex-1 flex items-center justify-center border-b border-zinc-800 bg-zinc-950/50">
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                  <span className="text-4xl text-zinc-600">?</span>
                </div>
                <div className="text-xl font-medium text-zinc-300">Select or search for an item</div>
                <p className="text-sm text-zinc-500 mt-1">Market data will appear here once an item is selected</p>
              </div>
            </div>

            {/* Sellers Table */}
            <div className="p-4">
              <div className="font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" /> Sellers
              </div>
              <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-950 text-zinc-400">
                    <tr>
                      <th className="text-left p-3">Region</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-right p-3">Jumps</th>
                      <th className="text-right p-3">Expires In</th>
                      <th className="text-right p-3">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {MOCK_MARKET_SELLERS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900">
                        <td className="p-3">{row.region}</td>
                        <td className="p-3 text-right font-mono">{row.quantity.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">{row.price.toLocaleString()} ISK</td>
                        <td className="p-3">{row.location}</td>
                        <td className="p-3 text-right">{row.jumps}</td>
                        <td className="p-3 text-right text-zinc-400">{row.expires}</td>
                        <td className="p-3 text-right text-xs text-zinc-500">{row.lastModified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buyers Table */}
            <div className="p-4 pt-0">
              <div className="font-semibold mb-3 flex items-center gap-2 text-rose-400">
                <ShoppingCart className="w-4 h-4" /> Buyers
              </div>
              <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-950 text-zinc-400">
                    <tr>
                      <th className="text-left p-3">Region</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-right p-3">Jumps</th>
                      <th className="text-right p-3">Range</th>
                      <th className="text-right p-3">Min Volume</th>
                      <th className="text-right p-3">Expires In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {MOCK_MARKET_BUYERS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900">
                        <td className="p-3">{row.region}</td>
                        <td className="p-3 text-right font-mono">{row.quantity.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{row.price.toLocaleString()} ISK</td>
                        <td className="p-3">{row.location}</td>
                        <td className="p-3 text-right">{row.jumps}</td>
                        <td className="p-3 text-right">{row.range}</td>
                        <td className="p-3 text-right">{row.minVolume}</td>
                        <td className="p-3 text-right text-zinc-400">{row.expires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'Character':
        return (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-semibold mb-1">{activeCharacter.name}</h2>
              <p className="text-zinc-400 mb-8">{activeCharacter.corporation}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-800 p-6">
                  <div className="text-sm text-zinc-400">Wallet Balance</div>
                  <div className="text-4xl font-mono mt-2 text-emerald-400">1,284,392,450 ISK</div>
                </div>
                <div className="rounded-xl border border-zinc-800 p-6">
                  <div className="text-sm text-zinc-400">Current Training</div>
                  <div className="mt-2">Cybernetics V • 2d 17h remaining</div>
                  <div className="h-2 bg-zinc-800 rounded mt-3"><div className="h-2 w-[65%] bg-teal-500 rounded" /></div>
                </div>
                <div className="rounded-xl border border-zinc-800 p-6">
                  <div className="text-sm text-zinc-400">Location</div>
                  <div className="mt-2 text-lg">Jita IV - Moon 4<br />Caldari Navy Assembly Plant</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">🚀</div>
              <p className="text-xl">{activeTab} view coming online...</p>
              <p className="text-sm mt-2">Connected to local Rust backend + SurrealDB</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Top Bar - Add Character + Portrait Strip */}
      <div className="h-16 border-b border-zinc-800 flex items-center px-4 gap-4 bg-zinc-950/95 backdrop-blur z-50">
        <Button 
          onClick={handleAddCharacter}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
        >
          <Plus className="w-4 h-4" /> Add Character
        </Button>

        <div className="flex-1" />

        {/* Character Portraits Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pr-2">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => handleSelectCharacter(char.id)}
              className={`flex flex-col items-center group transition-all ${activeCharacterId === char.id ? 'scale-105' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${activeCharacterId === char.id ? 'ring-teal-500' : 'ring-zinc-700 group-hover:ring-zinc-500'} bg-zinc-800`}>
                {char.portraitUrl ? (
                  <img src={char.portraitUrl} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-400">
                    {char.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 truncate max-w-18 group-hover:text-white">{char.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Tab Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="bg-transparent p-0 h-12">
            {(['Character', 'Analytics', 'Industry', 'Market', 'Assets'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-none rounded-none px-6 text-sm border-b-2 border-transparent data-[state=active]:border-teal-500"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar (Contextual) */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950 overflow-y-auto shrink-0">
          {renderLeftToolbar()}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-900/30">
          {renderMainContent()}
        </div>

        {/* Right Sidebar - Chatbot */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-400" />
            <div>
              <div className="font-semibold">Local Assistant</div>
              <div className="text-[10px] text-emerald-400">Connected • Private</div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={chatScrollRef} className="flex-1 p-4 space-y-4 text-sm">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-zinc-900 text-zinc-200'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-400 px-4 py-2 rounded-2xl text-xs">Thinking...</div>
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask about market, skills, fits..."
                className="bg-zinc-900 border-zinc-700 flex-1"
                disabled={isChatLoading}
              />
              <Button 
                size="icon" 
                onClick={sendChatMessage} 
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-teal-600 hover:bg-teal-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[10px] text-center text-zinc-500 mt-1.5">Powered by your local Rust + llama.cpp instance</div>
          </div>
        </div>
      </div>
    </div>
  );
}