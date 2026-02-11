'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Save,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Bot,
  Key,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AI_PROVIDERS, type AISettings, DEFAULT_AI_SETTINGS } from '@/lib/ai-providers';

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    providerId: string;
    success: boolean;
    message: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Pre-fill API keys (masked)
        const keys: Record<string, string> = {};
        for (const [id, config] of Object.entries(data.providers || {})) {
          keys[id] = (config as { apiKey: string }).apiKey || '';
        }
        setApiKeys(keys);
      }
    } catch (error) {
      console.error('Failed to fetch AI settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const providerUpdates: Record<string, { apiKey: string }> = {};
      for (const [id, key] of Object.entries(apiKeys)) {
        providerUpdates[id] = { apiKey: key };
      }

      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProviderId: settings.activeProviderId,
          activeModelId: settings.activeModelId,
          providerUpdates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Refresh masked keys
        const keys: Record<string, string> = {};
        for (const [id, config] of Object.entries(data.providers || {})) {
          keys[id] = (config as { apiKey: string }).apiKey || '';
        }
        setApiKeys(keys);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTesting(providerId);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          modelId:
            settings.activeProviderId === providerId
              ? settings.activeModelId
              : AI_PROVIDERS.find((p) => p.id === providerId)?.models[0]?.id,
        }),
      });
      const data = await res.json();
      setTestResult({ providerId, success: data.success, message: data.message || data.error });
    } catch (error) {
      setTestResult({
        providerId,
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(null);
    }
  };

  const activeProvider = AI_PROVIDERS.find((p) => p.id === settings.activeProviderId);
  const activeModel = activeProvider?.models.find((m) => m.id === settings.activeModelId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-emerald-400" />
            AI Provider Settings
          </h1>
          <p className="text-slate-400">Konfigurasi provider AI, model, dan API key</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Pengaturan
        </Button>
      </div>

      {/* Active Configuration Summary */}
      <Card className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-emerald-800/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Konfigurasi Aktif</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Provider</p>
              <p className="text-white font-medium">
                {activeProvider ? `${activeProvider.logo} ${activeProvider.name}` : 'Belum dipilih'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Model</p>
              <p className="text-white font-medium">{activeModel?.name || 'Belum dipilih'}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              {settings.providers[settings.activeProviderId]?.isConfigured ? (
                <p className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Terkonfigurasi
                </p>
              ) : (
                <p className="text-yellow-400 font-medium flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Perlu API Key
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-6">
        {AI_PROVIDERS.map((provider) => {
          const isActive = settings.activeProviderId === provider.id;
          const providerConfig = settings.providers[provider.id];
          const isConfigured = providerConfig?.isConfigured;

          return (
            <Card
              key={provider.id}
              className={`border transition-colors ${
                isActive
                  ? 'bg-slate-900 border-emerald-600/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-3">
                    <span className="text-2xl">{provider.logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {provider.name}
                        {isActive && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                        {isConfigured && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            API Key Set
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-normal mt-0.5">
                        {provider.baseUrl}
                        {provider.completionPath}
                      </p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSettings((s) => ({
                            ...s,
                            activeProviderId: provider.id,
                            activeModelId: provider.models[0].id,
                          }));
                        }}
                        className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        Pilih Provider
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id] || ''}
                        onChange={(e) =>
                          setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                        }
                        placeholder={`Masukkan ${provider.name} API Key...`}
                        className="bg-slate-800 border-slate-700 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={testing === provider.id || !apiKeys[provider.id]}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      {testing === provider.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Test
                    </Button>
                  </div>
                  {/* Test result */}
                  {testResult?.providerId === provider.id && (
                    <div
                      className={`text-sm p-3 rounded-lg ${
                        testResult.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 inline mr-2" />
                      )}
                      {testResult.message}
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-400" />
                    Model
                  </label>
                  <div className="grid gap-2">
                    {provider.models.map((model) => {
                      const isModelActive = isActive && settings.activeModelId === model.id;

                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSettings((s) => ({
                              ...s,
                              activeProviderId: provider.id,
                              activeModelId: model.id,
                            }));
                          }}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            isModelActive
                              ? 'bg-emerald-600/10 border-emerald-600/40 shadow-sm'
                              : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium text-sm">{model.name}</span>
                                {isModelActive && (
                                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                                    AKTIF
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{model.description}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-[10px] text-slate-500">
                                Context: {(model.contextWindow / 1000).toFixed(0)}K
                              </p>
                              {model.pricing && (
                                <p className="text-[10px] text-slate-500">{model.pricing}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
