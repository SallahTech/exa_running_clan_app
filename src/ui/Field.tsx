/**
 * Form field for the auth screens: an 800/9px tracked label above a #0d0d10
 * input with a 1px white-alpha border. No radius, no focus ring beyond the
 * border brightening.
 *
 * The prototype implements no validation; production needs it, so the error
 * slot below is part of the primitive rather than bolted on per screen.
 */

import { useEffect, useState, type Ref } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { brand } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';
import { t } from '../i18n';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  helper?: string;
  inputRef?: Ref<TextInput>;
}

export function Field({ label, error, helper, inputRef, secureTextEntry, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // An error appearing below a field is invisible to VoiceOver unless announced.
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(`${label}: ${error}`);
  }, [error, label]);

  const borderColor = error
    ? brand.accent
    : focused
      ? 'rgba(255,255,255,0.45)'
      : 'rgba(255,255,255,0.18)';

  return (
    <View style={styles.wrap}>
      <Txt role="kicker9" color="#8d8d92" style={styles.label}>
        {label}
      </Txt>
      <View>
      <TextInput
        {...rest}
        ref={inputRef}
        secureTextEntry={secureTextEntry && !revealed}
        maxFontSizeMultiplier={1.6}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor="#77777d"
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        style={[styles.input, secureTextEntry ? styles.inputToggle : null, { borderColor }]}
      />
      {secureTextEntry ? (
        <Pressable
          onPress={() => setRevealed((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t(revealed ? 'auth.hidePassword' : 'auth.showPassword')}
          style={({ pressed }) => [styles.toggle, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Txt role="button11" color="#8d8d92">
            {t(revealed ? 'auth.hide' : 'auth.show')}
          </Txt>
        </Pressable>
      ) : null}
      </View>
      {error ? (
        <Txt role="micro" color={brand.accentOnDark} style={styles.note}>
          {error}
        </Txt>
      ) : helper ? (
        <Txt role="micro" color="#8d8d92" style={styles.note}>
          {helper}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 6 },
  input: {
    width: '100%',
    minHeight: 44,
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    color: '#f2f2f4',
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
  },
  inputToggle: { paddingRight: 64 },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: 6 },
});

/** The in-app field — same anatomy as `Field`, on the palette rather than on black. */
export function FormField({ label, error, helper, ...rest }: Omit<FieldProps, 'inputRef'>) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Txt role="appLabel" muted style={styles.label}>
        {label}
      </Txt>
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        maxFontSizeMultiplier={1.6}
        placeholderTextColor={p.muted}
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        style={[
          styles.input,
          {
            color: p.text,
            backgroundColor: p.surface,
            borderColor: error ? brand.accent : focused ? p.muted : 'transparent',
            fontSize: 16,
          },
        ]}
      />
      {error || helper ? (
        <Txt
          role="appMeta"
          color={error ? (p.scheme === 'dark' ? brand.accentOnDark : brand.accent) : p.muted}
          style={styles.note}
        >
          {error ?? helper}
        </Txt>
      ) : null}
    </View>
  );
}
