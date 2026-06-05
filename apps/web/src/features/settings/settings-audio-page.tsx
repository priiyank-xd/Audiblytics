'use client';

import { Gauge, Mic, Pause } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';
import { useVoices } from '@/lib/audio/tts';

export function SettingsAudioPage() {
  const { voiceUriDraft, setVoiceUriDraft, setError, saveAudio } = useSettingsHub();
  const voices = useVoices();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-ui-sm font-medium text-foreground">Text-to-speech</h2>

        <SettingsCardRow
          icon={Mic}
          title="Voice"
          description="Browser voice for word and paragraph playback."
        >
          {voices.length === 0 ? (
            <p className="text-body text-secondary">Loading voices…</p>
          ) : (
            <Select
              value={
                voiceUriDraft != null && voices.some((v) => v.voiceURI === voiceUriDraft)
                  ? voiceUriDraft
                  : '__default__'
              }
              onValueChange={(v) => {
                if (v === null) return;
                setVoiceUriDraft(v === '__default__' ? null : v);
                setError(null);
              }}
              disabled={voices.length === 0}
            >
              <SelectTrigger id="settings-voice" className="w-full min-w-0">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Browser default</SelectItem>
                {voices.map((v) => (
                  <SelectItem key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SettingsCardRow>

        <SettingsSaveFooter onSave={saveAudio} />
      </div>

      <div className="space-y-4 border-t border-divider pt-6">
        <h2 className="text-ui-sm font-medium text-foreground">Advanced audio</h2>

        <SettingsCardRow
          icon={Gauge}
          title="Speech rate"
          description="Coming soon."
        >
          <Label className="text-caption text-secondary">Coming soon</Label>
        </SettingsCardRow>

        <SettingsCardRow
          icon={Pause}
          title="Pause between sentences"
          description="Coming soon."
        >
          <Label className="text-caption text-secondary">Coming soon</Label>
        </SettingsCardRow>
      </div>
    </div>
  );
}
