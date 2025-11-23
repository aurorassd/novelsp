import React, { useState, useEffect } from 'react';
import { Project, Character, WorldItem, TONE_PRESETS } from './models';
import { Menu, X, Save, FolderOpen, Copy, Plus, Trash2, FileText, Settings, Clipboard } from 'lucide-react';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, isMobile }) => {
    const tabs = [
        { id: 'project', label: 'プロジェクト', icon: <FolderOpen size={20} /> },
        { id: 'files', label: 'ファイル', icon: <FileText size={20} /> },
        { id: 'prompt', label: 'プロンプト', icon: <Copy size={20} /> },
        { id: 'settings', label: '設定', icon: <Settings size={20} /> },
    ];

    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
                <h1 className="text-xl font-bold text-white">Novel Architect</h1>
                {isMobile && (
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                )}
            </div>
            <nav className="p-2 space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); if (isMobile) setIsOpen(false); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

const ProjectTab = ({ project, setProject, onEditItem }) => {
    const addChar = () => {
        const newProj = Project.fromJSON(JSON.parse(JSON.stringify(project)));
        newProj.characters.push(new Character("新規キャラクター"));
        setProject(newProj);
    };

    const addWorld = () => {
        const newProj = Project.fromJSON(JSON.parse(JSON.stringify(project)));
        newProj.worldItems.push(new WorldItem("新規設定"));
        setProject(newProj);
    };

    const deleteItem = (type, id) => {
        if (!confirm("削除しますか？")) return;
        const newProj = Project.fromJSON(JSON.parse(JSON.stringify(project)));
        if (type === 'char') newProj.characters = newProj.characters.filter(c => c.id !== id);
        else newProj.worldItems = newProj.worldItems.filter(w => w.id !== id);
        setProject(newProj);
    };

    const downloadProject = () => {
        const data = JSON.stringify(project, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title || 'project'}.json`;
        a.click();
    };

    const loadProject = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target.result);
                setProject(Project.fromJSON(json));
                alert("プロジェクトを読み込みました");
            } catch (err) {
                alert("読み込みエラー: " + err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 space-y-6 h-full overflow-y-auto">
            <div className="flex space-x-2 mb-4">
                <button onClick={downloadProject} className="btn btn-primary flex items-center"><Save size={16} className="mr-2" /> 保存 (JSON)</button>
                <label className="btn btn-secondary flex items-center cursor-pointer">
                    <FolderOpen size={16} className="mr-2" /> 読込
                    <input type="file" accept=".json" onChange={loadProject} className="hidden" />
                </label>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-slate-200">キャラクター</h2>
                    <button onClick={addChar} className="p-1 bg-slate-800 rounded hover:bg-slate-700"><Plus size={20} /></button>
                </div>
                <div className="space-y-2">
                    {project.characters.map(c => (
                        <div key={c.id} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
                            <span className="font-medium cursor-pointer flex-1" onClick={() => onEditItem(c, 'char')}>{c.name}</span>
                            <button onClick={() => deleteItem('char', c.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-slate-200">世界観・設定</h2>
                    <button onClick={addWorld} className="p-1 bg-slate-800 rounded hover:bg-slate-700"><Plus size={20} /></button>
                </div>
                <div className="space-y-2">
                    {project.worldItems.map(w => (
                        <div key={w.id} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
                            <span className="font-medium cursor-pointer flex-1" onClick={() => onEditItem(w, 'world')}>{w.name}</span>
                            <button onClick={() => deleteItem('world', w.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PromptBuilder = ({ project, onSendToEditor }) => {
    const [tone, setTone] = useState(Object.keys(TONE_PRESETS)[0]);
    const [selectedContext, setSelectedContext] = useState({});
    const [structure, setStructure] = useState({
        subtitle: { enabled: false, value: '' },
        length: { enabled: false, value: '' },
        time: { enabled: false, value: '夜' },
        ratio: { enabled: false, value: 50 },
        notes: { enabled: false, value: '' },
    });
    const [instruction, setInstruction] = useState('');
    const [preview, setPreview] = useState('');

    const toggleContext = (id) => {
        setSelectedContext(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleStructure = (key) => {
        setStructure(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
    };

    const updateStructure = (key, val) => {
        setStructure(prev => ({ ...prev, [key]: { ...prev[key], value: val } }));
    };

    const generate = () => {
        const toneInst = TONE_PRESETS[tone];

        let contextText = "";
        project.characters.forEach(c => {
            if (selectedContext[c.id]) contextText += `--- Character: ${c.name} ---\n${c.description}\n\n`;
        });
        project.worldItems.forEach(w => {
            if (selectedContext[w.id]) contextText += `--- World: ${w.name} (${w.category}) ---\n${w.description}\n\n`;
        });

        let structText = "";
        if (structure.subtitle.enabled) structText += `Subtitle: ${structure.subtitle.value}\n`;
        if (structure.length.enabled) structText += `Length: ${structure.length.value}\n`;
        if (structure.time.enabled) structText += `Time: ${structure.time.value}\n`;
        if (structure.ratio.enabled) structText += `Ratio: Dialogue ${structure.ratio.value}% / Narration ${100 - structure.ratio.value}%\n`;

        let notesText = "";
        if (structure.notes.enabled) notesText = `Notes:\n${structure.notes.value}`;

        const final = `# Tone\n${toneInst}\n\n# Context\n${contextText}\n# Structure\n${structText}\n# Instruction\n${instruction}\n\n${notesText}`;
        setPreview(final);
        navigator.clipboard.writeText(final).then(() => alert("コピーしました"));
    };

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Config Panel */}
            <div className="w-full md:w-1/3 bg-slate-900 p-4 overflow-y-auto border-r border-slate-800">
                <h3 className="font-bold mb-2 text-slate-300">トーン / スタイル</h3>
                <select className="input-field mb-4" value={tone} onChange={e => setTone(e.target.value)}>
                    {Object.keys(TONE_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>

                <h3 className="font-bold mb-2 text-slate-300">コンテキスト</h3>
                <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
                    {project.characters.map(c => (
                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={!!selectedContext[c.id]} onChange={() => toggleContext(c.id)} className="rounded bg-slate-700 border-slate-600" />
                            <span className="text-sm">{c.name}</span>
                        </label>
                    ))}
                    {project.worldItems.map(w => (
                        <label key={w.id} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={!!selectedContext[w.id]} onChange={() => toggleContext(w.id)} className="rounded bg-slate-700 border-slate-600" />
                            <span className="text-sm">{w.name}</span>
                        </label>
                    ))}
                </div>

                <h3 className="font-bold mb-2 text-slate-300">構成オプション</h3>
                <div className="space-y-3">
                    {/* Subtitle */}
                    <div>
                        <label className="flex items-center space-x-2 mb-1">
                            <input type="checkbox" checked={structure.subtitle.enabled} onChange={() => toggleStructure('subtitle')} />
                            <span className="text-sm">サブタイトル</span>
                        </label>
                        <input type="text" disabled={!structure.subtitle.enabled} value={structure.subtitle.value} onChange={e => updateStructure('subtitle', e.target.value)} className="input-field text-sm py-1" placeholder="サブタイトル" />
                    </div>
                    {/* Time */}
                    <div>
                        <label className="flex items-center space-x-2 mb-1">
                            <input type="checkbox" checked={structure.time.enabled} onChange={() => toggleStructure('time')} />
                            <span className="text-sm">時間帯</span>
                        </label>
                        <select disabled={!structure.time.enabled} value={structure.time.value} onChange={e => updateStructure('time', e.target.value)} className="input-field text-sm py-1">
                            {["朝", "昼", "夕", "夜", "深夜"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {/* Ratio */}
                    <div>
                        <label className="flex items-center space-x-2 mb-1">
                            <input type="checkbox" checked={structure.ratio.enabled} onChange={() => toggleStructure('ratio')} />
                            <span className="text-sm">比率 (会話 {structure.ratio.value}%)</span>
                        </label>
                        <input type="range" min="0" max="100" disabled={!structure.ratio.enabled} value={structure.ratio.value} onChange={e => updateStructure('ratio', e.target.value)} className="w-full" />
                    </div>
                </div>
            </div>

            {/* Assembly Panel */}
            <div className="w-full md:w-2/3 p-4 flex flex-col h-full">
                <h3 className="font-bold mb-2 text-slate-300">指示 / 本文</h3>
                <textarea
                    className="input-field flex-1 mb-4 font-mono text-sm resize-none"
                    placeholder="ここに指示を書く..."
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                />
                <div className="flex space-x-2 mb-4">
                    <button onClick={generate} className="btn btn-primary flex-1">生成してコピー</button>
                    <button onClick={() => onSendToEditor(preview)} className="btn btn-secondary flex-1 bg-green-800 hover:bg-green-700 border-green-700 text-white">エディタへ送る</button>
                </div>
                <h3 className="font-bold mb-2 text-slate-300">プレビュー</h3>
                <textarea
                    className="input-field h-40 font-mono text-xs resize-none bg-slate-950"
                    readOnly
                    value={preview}
                />
            </div>
        </div>
    );
};

const EditorTab = ({ tabs, setTabs, activeTabId, setActiveTabId }) => {
    const activeTab = tabs.find(t => t.id === activeTabId);

    const updateContent = (val) => {
        setTabs(tabs.map(t => t.id === activeTabId ? { ...t, content: val } : t));
    };

    const closeTab = (id, e) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id && newTabs.length > 0) setActiveTabId(newTabs[0].id);
    };

    const newTab = () => {
        const id = crypto.randomUUID();
        setTabs([...tabs, { id, title: '無題', content: '' }]);
        setActiveTabId(id);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex overflow-x-auto bg-slate-900 border-b border-slate-800">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center px-4 py-2 border-r border-slate-800 cursor-pointer min-w-[120px] ${activeTabId === tab.id ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <span className="truncate flex-1 text-sm">{tab.title}</span>
                        <button onClick={(e) => closeTab(tab.id, e)} className="ml-2 text-slate-500 hover:text-slate-300"><X size={14} /></button>
                    </div>
                ))}
                <button onClick={newTab} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800"><Plus size={18} /></button>
            </div>
            <div className="flex-1 relative">
                {activeTab ? (
                    <textarea
                        className="w-full h-full bg-slate-950 text-slate-200 p-4 resize-none focus:outline-none font-mono leading-relaxed"
                        value={activeTab.content}
                        onChange={e => updateContent(e.target.value)}
                        placeholder="ここに執筆..."
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">タブを開いてください</div>
                )}
            </div>
        </div>
    );
};

const ContextEditor = ({ item, onSave, onCancel }) => {
    const [name, setName] = useState(item.name);
    const [desc, setDesc] = useState(item.description);

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">編集: {item.name}</h2>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-slate-400">名前</label>
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-1 text-slate-400">詳細 / 説明</label>
                <textarea className="input-field h-64 resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="flex space-x-4">
                <button onClick={() => onSave({ ...item, name, description: desc })} className="btn btn-primary flex-1">保存</button>
                <button onClick={onCancel} className="btn btn-secondary flex-1">キャンセル</button>
            </div>
        </div>
    );
};

// --- Main App ---

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('project');
    const [project, setProject] = useState(new Project());
    const [editorTabs, setEditorTabs] = useState([{ id: '1', title: '無題', content: '' }]);
    const [activeEditorTabId, setActiveEditorTabId] = useState('1');
    const [editingItem, setEditingItem] = useState(null); // { item, type }

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedProj = localStorage.getItem('novel_project');
        if (savedProj) {
            try {
                setProject(Project.fromJSON(JSON.parse(savedProj)));
            } catch (e) { console.error("Failed to load project", e); }
        }
    }, []);

    // Auto-save to LocalStorage
    useEffect(() => {
        localStorage.setItem('novel_project', JSON.stringify(project));
    }, [project]);

    const handleEditItem = (item, type) => {
        setEditingItem({ item, type });
    };

    const handleSaveItem = (newItem) => {
        const newProj = Project.fromJSON(JSON.parse(JSON.stringify(project)));
        if (editingItem.type === 'char') {
            newProj.characters = newProj.characters.map(c => c.id === newItem.id ? newItem : c);
        } else {
            newProj.worldItems = newProj.worldItems.map(w => w.id === newItem.id ? newItem : w);
        }
        setProject(newProj);
        setEditingItem(null);
    };

    const handleSendToEditor = (text) => {
        const id = crypto.randomUUID();
        setEditorTabs([...editorTabs, { id, title: '下書き', content: text }]);
        setActiveEditorTabId(id);
        setActiveTab('files');
        alert("エディタに送信しました");
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-20">
                <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 mr-4"><Menu /></button>
                <h1 className="font-bold text-lg">Novel Architect</h1>
            </div>

            <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setEditingItem(null); }}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isMobile={window.innerWidth < 768}
            />

            <main className="flex-1 pt-14 md:pt-0 relative overflow-hidden">
                {editingItem ? (
                    <ContextEditor item={editingItem.item} onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                ) : (
                    <>
                        {activeTab === 'project' && <ProjectTab project={project} setProject={setProject} onEditItem={handleEditItem} />}
                        {activeTab === 'files' && <EditorTab tabs={editorTabs} setTabs={setEditorTabs} activeTabId={activeEditorTabId} setActiveTabId={setActiveEditorTabId} />}
                        {activeTab === 'prompt' && <PromptBuilder project={project} onSendToEditor={handleSendToEditor} />}
                        {activeTab === 'settings' && <div className="p-8 text-center text-slate-500">設定機能は現在開発中です (テーマ: ダーク固定)</div>}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
