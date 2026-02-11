'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Package,
  Save,
  Loader2,
  RefreshCcw,
  ToggleRight,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Users,
  UserCog,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  FEATURE_DEFINITIONS,
  PACKAGE_PRESETS,
  CATEGORY_LABELS,
  DEFAULT_FEATURE_FLAGS,
  MANAGEABLE_ROLES,
  ROLE_LABELS,
  ROLE_COLORS,
  getAllFeatureKeysForRole,
  type FeatureFlags,
  type PackagePreset,
  type ManageableRole,
} from '@/lib/feature-flags';
import { useFeatureFlags } from '@/contexts/feature-flags-context';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeRole, setActiveRole] = useState<ManageableRole>('ADMIN');
  const { refreshFlags } = useFeatureFlags();

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const data: FeatureFlags = await res.json();
        setFlags(data);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handlePresetSelect = (preset: PackagePreset) => {
    const presetData = PACKAGE_PRESETS[preset];
    setFlags({
      ...flags,
      activePackage: preset,
      enabledFeatures: { ...presetData.enabledFeatures },
    });
    setHasChanges(true);
  };

  const handleFeatureToggle = (featureKey: string, role: ManageableRole) => {
    const roleFeatures = [...(flags.enabledFeatures[role] || [])];
    const idx = roleFeatures.indexOf(featureKey);

    if (idx > -1) {
      roleFeatures.splice(idx, 1);
    } else {
      roleFeatures.push(featureKey);
    }

    setFlags({
      ...flags,
      activePackage: 'custom',
      enabledFeatures: {
        ...flags.enabledFeatures,
        [role]: roleFeatures,
      },
    });
    setHasChanges(true);
  };

  const handleToggleAllForRole = (role: ManageableRole, enabled: boolean) => {
    const allKeys = enabled ? getAllFeatureKeysForRole(role) : [];
    setFlags({
      ...flags,
      activePackage: 'custom',
      enabledFeatures: {
        ...flags.enabledFeatures,
        [role]: allKeys,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });

      if (res.ok) {
        toast.success('Pengaturan fitur berhasil disimpan');
        setHasChanges(false);
        await refreshFlags();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Failed to save feature flags:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  // Get features applicable to the active role, grouped by category
  const applicableFeatures = FEATURE_DEFINITIONS.filter((f) =>
    f.applicableRoles.includes(activeRole)
  );

  const groupedFeatures = applicableFeatures.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, typeof FEATURE_DEFINITIONS>
  );

  // Stats
  const roleFeatures = flags.enabledFeatures[activeRole] || [];
  const totalApplicable = applicableFeatures.length;
  const enabledCount = roleFeatures.length;
  const aiApplicable = applicableFeatures.filter((f) => f.isAI);
  const enabledAICount = aiApplicable.filter((f) => roleFeatures.includes(f.key)).length;

  // Stats across all roles
  const overallStats = MANAGEABLE_ROLES.map((role) => {
    const all = getAllFeatureKeysForRole(role);
    const enabled = flags.enabledFeatures[role] || [];
    return {
      role,
      total: all.length,
      enabled: enabled.length,
    };
  });

  const roleIcons: Record<ManageableRole, React.ReactNode> = {
    ADMIN: <UserCog className="w-4 h-4" />,
    STAFF: <Users className="w-4 h-4" />,
    CLIENT: <UserCheck className="w-4 h-4" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Paket & Fitur
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola fitur sidebar per-role berdasarkan paket langganan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              fetchFlags();
              setHasChanges(false);
            }}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan
          </Button>
        </div>
      </div>

      {/* Super Admin Notice */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-amber-300 font-medium">
              Super Admin selalu melihat semua fitur
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Pengaturan ini mengontrol sidebar untuk role Admin, Staff, dan Client.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Package Presets */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Preset Paket
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PACKAGE_PRESETS) as PackagePreset[]).map((presetKey) => {
            const preset = PACKAGE_PRESETS[presetKey];
            const isActive = flags.activePackage === presetKey;
            const colorMap: Record<
              string,
              {
                ring: string;
                bg: string;
                badge: string;
                icon: string;
              }
            > = {
              emerald: {
                ring: 'ring-emerald-500',
                bg: 'bg-emerald-500/10',
                badge: 'bg-emerald-500/20 text-emerald-400',
                icon: 'from-emerald-500 to-emerald-700',
              },
              blue: {
                ring: 'ring-blue-500',
                bg: 'bg-blue-500/10',
                badge: 'bg-blue-500/20 text-blue-400',
                icon: 'from-blue-500 to-blue-700',
              },
              purple: {
                ring: 'ring-purple-500',
                bg: 'bg-purple-500/10',
                badge: 'bg-purple-500/20 text-purple-400',
                icon: 'from-purple-500 to-purple-700',
              },
            };
            const colors = colorMap[preset.color];

            // Count total features across all roles for this preset
            const totalPresetFeatures = new Set(Object.values(preset.enabledFeatures).flat()).size;

            return (
              <Card
                key={presetKey}
                className={`bg-slate-900 border-slate-800 cursor-pointer transition-all hover:border-slate-600 ${
                  isActive ? `ring-2 ${colors.ring} ${colors.bg}` : ''
                }`}
                onClick={() => handlePresetSelect(presetKey)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.icon} flex items-center justify-center text-xl`}
                    >
                      {preset.icon}
                    </div>
                    {isActive && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}
                      >
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg">{preset.label}</h3>
                  <p className="text-slate-400 text-sm mt-1">{preset.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    {MANAGEABLE_ROLES.map((role) => (
                      <span key={role} className="flex items-center gap-1">
                        {roleIcons[role]}
                        {preset.enabledFeatures[role].length}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MANAGEABLE_ROLES.map((role) => {
            const roleStat = overallStats.find((s) => s.role === role)!;
            const colors = ROLE_COLORS[role];
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? `${colors.bg} ${colors.text} border-current`
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
              >
                {roleIcons[role]}
                <span>{ROLE_LABELS[role]}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? `${colors.bg} ${colors.text}` : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {roleStat.enabled}/{roleStat.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats for active role */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {enabledCount}/{totalApplicable}
              </p>
              <p className="text-xs text-slate-400 mt-1">Fitur Aktif</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {enabledAICount}/{aiApplicable.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">AI Aktif</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {flags.updatedAt
                  ? new Date(flags.updatedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Terakhir Diubah</p>
            </CardContent>
          </Card>
        </div>

        {/* Toggle All for Active Role */}
        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <ToggleRight className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">
              Toggle semua untuk {ROLE_LABELS[activeRole]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAllForRole(activeRole, true)}
              className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Aktifkan Semua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAllForRole(activeRole, false)}
              className="border-red-600/50 text-red-400 hover:bg-red-500/10 text-xs"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Nonaktifkan Semua
            </Button>
          </div>
        </div>

        {/* Feature List by Category for Active Role */}
        <div className="space-y-4">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <Card key={category} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center justify-between">
                  <span>{CATEGORY_LABELS[category] || category}</span>
                  <span className="text-xs font-normal text-slate-500">
                    {features.filter((f) => roleFeatures.includes(f.key)).length}/{features.length}{' '}
                    aktif
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800">
                  {features.map((feature) => {
                    const isEnabled = roleFeatures.includes(feature.key);

                    // Show which OTHER roles also have this feature enabled
                    const otherRolesEnabled = MANAGEABLE_ROLES.filter(
                      (r) =>
                        r !== activeRole &&
                        feature.applicableRoles.includes(r) &&
                        (flags.enabledFeatures[r] || []).includes(feature.key)
                    );

                    return (
                      <div
                        key={feature.key}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                              isEnabled ? 'bg-emerald-400' : 'bg-slate-600'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-medium text-sm transition-colors ${
                                  isEnabled ? 'text-white' : 'text-slate-500'
                                }`}
                              >
                                {feature.label}
                              </span>
                              {feature.isAI && (
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                                    feature.isFullAI
                                      ? 'bg-purple-500/20 text-purple-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                  }`}
                                >
                                  {feature.isFullAI ? 'Full AI' : 'Basic AI'}
                                </span>
                              )}
                              {feature.sidebarHref && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-500 font-mono">
                                  Sidebar
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 truncate">
                                {feature.description}
                              </p>
                              {otherRolesEnabled.length > 0 && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {otherRolesEnabled.map((r) => (
                                    <span
                                      key={r}
                                      className={`px-1 py-0 text-[9px] rounded ${ROLE_COLORS[r].bg} ${ROLE_COLORS[r].text}`}
                                    >
                                      {ROLE_LABELS[r]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleFeatureToggle(feature.key, activeRole)}
                          className="shrink-0 ml-4"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 px-8 py-6 text-base"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      )}
    </div>
  );
}
