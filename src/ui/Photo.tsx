/**
 * A photograph from storage, or the labelled placeholder when there isn't one
 * yet.
 *
 * Photography is rendered grayscale, as in the design. That is done here with a
 * render-time filter rather than by converting on upload, so the original stays
 * in colour — a club that later wants colour photos changes one line instead of
 * re-uploading everything.
 */

import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isPlaceholder, placeholderLabel, signPhotoUrls } from '../data/photos';
import { grayscale } from './filters';
import { Placeholder } from './Placeholder';

export interface PhotoProps {
  /** Storage path, or a `placeholder://…` string from the seed. */
  path: string | null | undefined;
  height?: number;
  /** Shown when there is no photograph — falls back to the path's own label. */
  fallbackLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Photo({ path, height, fallbackLabel, style, children }: PhotoProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    if (isPlaceholder(path)) {
      setUrl(null);
      return;
    }

    signPhotoUrls([path as string])
      .then((map) => {
        if (live) setUrl(map.get(path as string) ?? null);
      })
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [path]);

  if (!url) {
    const label = path && isPlaceholder(path) ? placeholderLabel(path) : fallbackLabel;
    return (
      <Placeholder label={label} height={height} style={style}>
        {children}
      </Placeholder>
    );
  }

  return (
    <View style={[height !== undefined ? { height } : null, styles.wrap, style]}>
      <Image source={{ uri: url }} style={styles.image} accessibilityIgnoresInvertColors />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
  image: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // The design treats all photography grayscale.
    ...grayscale(),
  },
});
