import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { ServiceArea, ServiceAreaCity } from '../../types';
import { toast } from 'sonner';

export function ServiceAreasConfig({ darkMode }: { darkMode: boolean }) {
  const { serviceAreas, addServiceArea, updateServiceArea, deleteServiceArea } = useStore();
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  
  // city input for each region
  const [cityInput, setCityInput] = useState<Record<string, string>>({});
  // township input for each city (keyed by regionId-cityIndex)
  const [townshipInput, setTownshipInput] = useState<Record<string, string>>({});
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const toggleRegion = (id: string) => {
    setExpandedRegions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) {
      toast.error('Region name is required');
      return;
    }
    await addServiceArea({
      region: newRegionName.trim(),
      cities: [],
      isActive: true
    });
    setNewRegionName('');
    setIsAddingRegion(false);
  };

  const handleAddCity = async (region: ServiceArea) => {
    const cityName = cityInput[region.id]?.trim();
    if (!cityName) return;
    
    const existingCities = region.cities || [];
    if (existingCities.some(c => c.name.toLowerCase() === cityName.toLowerCase())) {
       toast.error('City already exists in this region');
       return;
    }
    
    const newCities = [...existingCities, { name: cityName, townships: [] }];
    await updateServiceArea(region.id, { cities: newCities });
    setCityInput(prev => ({ ...prev, [region.id]: '' }));
  };
  
  const handleDeleteCity = async (region: ServiceArea, cityIndex: number) => {
    const newCities = [...(region.cities || [])];
    newCities.splice(cityIndex, 1);
    await updateServiceArea(region.id, { cities: newCities });
  };

  const handleAddTownships = async (region: ServiceArea, cityIndex: number) => {
    const key = `${region.id}-${cityIndex}`;
    const input = townshipInput[key];
    if (!input) return;
    
    const newTownships = input.split(',').map(t => t.trim()).filter(t => t);
    if (newTownships.length === 0) return;
    
    const cities = region.cities || [];
    const city = cities[cityIndex];
    if (!city) return;

    const existingTownships = city.townships || [];
    const finalTownships = Array.from(new Set([...existingTownships, ...newTownships]));
    
    const newCities = [...cities];
    newCities[cityIndex] = { ...city, townships: finalTownships };
    
    await updateServiceArea(region.id, { cities: newCities });
    setTownshipInput(prev => ({ ...prev, [key]: '' }));
  };
  
  const handleRemoveTownship = async (region: ServiceArea, cityIndex: number, townshipIndex: number) => {
    const cities = region.cities || [];
    const city = cities[cityIndex];
    if (!city) return;

    const newTownships = [...city.townships];
    newTownships.splice(townshipIndex, 1);
    
    const newCities = [...cities];
    newCities[cityIndex] = { ...city, townships: newTownships };
    
    await updateServiceArea(region.id, { cities: newCities });
  };

  return (
    <div className={`rounded-3xl p-6 border ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-on-surface/5'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Service Areas</h3>
            <p className="text-sm opacity-60">Manage regions, cities, and townships where you deliver</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingRegion(!isAddingRegion)}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center md:justify-start gap-2 hover:bg-primary-container transition-all whitespace-nowrap"
        >
          {isAddingRegion ? <X size={16} /> : <Plus size={16} />}
          {isAddingRegion ? 'Cancel' : 'Add Region'}
        </button>
      </div>

      <AnimatePresence>
        {isAddingRegion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 mb-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newRegionName}
                onChange={e => setNewRegionName(e.target.value)}
                placeholder="Region name (e.g., Yangon Region)"
                className={`flex-1 px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
              <button
                onClick={handleAddRegion}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all"
              >
                Save Region
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {serviceAreas.map(area => {
          const isExpanded = expandedRegions[area.id] || false;
          const areaCities = area.cities || [];

          return (
            <div key={area.id} className={`rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-white/5' : 'bg-white border-slate-200'} shadow-sm overflow-hidden`}>
              {/* Region Header */}
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                onClick={() => toggleRegion(area.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} className="opacity-50" /> : <ChevronRight size={18} className="opacity-50" />}
                  <span className="font-bold text-[15px]">{area.region}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${areaCities.length ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : 'bg-slate-500/20 text-slate-500'}`}>
                    {areaCities.length} Cities
                  </span>
                </div>
                
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => updateServiceArea(area.id, { isActive: !area.isActive })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${area.isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-600'}`}
                  >
                    {area.isActive ? 'Active' : 'Hidden'}
                  </button>
                  
                  {deleteConfirm === area.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteServiceArea(area.id)} className="px-2 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} className={`px-2 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(area.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Cities & Townships (Expanded Content) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-t ${darkMode ? 'border-white/5 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}
                  >
                    <div className="p-4 space-y-6">
                      {/* Add City Input */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={cityInput[area.id] || ''}
                          onChange={e => setCityInput(prev => ({ ...prev, [area.id]: e.target.value }))}
                          placeholder="Add new city..."
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddCity(area);
                          }}
                        />
                        <button
                          onClick={() => handleAddCity(area)}
                          disabled={!cityInput[area.id]}
                          className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 hover:bg-indigo-600 transition-all"
                        >
                          Add City
                        </button>
                      </div>

                      {/* City List */}
                      {areaCities.map((city, cityIndex) => {
                        const tk = `${area.id}-${cityIndex}`;
                        return (
                          <div key={cityIndex} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-current border-opacity-10">
                              <span className="font-bold text-sm text-indigo-500">{city.name}</span>
                              <button
                                onClick={() => handleDeleteCity(area, cityIndex)}
                                className="text-xs text-red-500 hover:underline flex items-center gap-1 opacity-70 hover:opacity-100"
                              >
                                <Trash2 size={12} /> Remove City
                              </button>
                            </div>
                            
                            {/* Townships display */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {city.townships.map((township, tIndex) => (
                                <div key={tIndex} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                  <span>{township}</span>
                                  <button onClick={() => handleRemoveTownship(area, cityIndex, tIndex)} className="opacity-50 hover:opacity-100 text-red-500 ml-1">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              {city.townships.length === 0 && (
                                <span className="text-xs italic opacity-40">No townships added</span>
                              )}
                            </div>

                            {/* Add Townships Input */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={townshipInput[tk] || ''}
                                onChange={e => setTownshipInput(prev => ({ ...prev, [tk]: e.target.value }))}
                                placeholder="Add townships (comma separated)"
                                className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddTownships(area, cityIndex);
                                }}
                              />
                              <button
                                onClick={() => handleAddTownships(area, cityIndex)}
                                disabled={!townshipInput[tk]}
                                className="px-3 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {areaCities.length === 0 && (
                        <div className="text-center py-6">
                          <MapPin size={24} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm opacity-50">No cities added yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {serviceAreas.length === 0 && (
          <div className="text-center py-10 opacity-50 border-2 border-dashed rounded-2xl border-current">
            <MapPin size={32} className="mx-auto mb-3 opacity-50" />
            <p>No regions configured yet. Add a region to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
