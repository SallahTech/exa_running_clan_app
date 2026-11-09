/**
 * The meet-point map in the run sheet.
 *
 * Built from raster tiles rather than a map SDK. The design shows a 130px band
 * fixed on one point — there is nothing to pan or zoom to — and a tile map has
 * three practical advantages here: it needs no API key, it runs in Expo Go and
 * in the browser rather than forcing a native dev build, and it renders
 * identically on every platform. Tapping it hands off to the phone's own maps
 * app, which is where someone actually wants to be when they need directions.
 *
 * If the club later wants a live route line or pan/zoom, swap this for
 * react-native-maps behind the same props — nothing above it changes.
 *
 * Tiles come from the OpenStreetMap public server, which is fine for
 * development but asks that production traffic use a proper provider. Point
 * TILE_URL at your own tile host (or MapTiler / Stadia / Thunderforest) before
 * launch; that is the only line that needs to change.
 */

import { useMemo } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { brand } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { grayscale } from './filters';
import { Placeholder } from './Placeholder';
import { Txt } from './Txt';
import { t } from '../i18n';

const TILE_SIZE = 256;
const ZOOM = 15;
const TILE_URL = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** Web-mercator world pixel coordinates at the given zoom. */
function project(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n * TILE_SIZE;
  const y =
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n * TILE_SIZE;
  return { x, y, n };
}

export interface MeetMapProps {
  lat: number | null;
  lng: number | null;
  /** "GSO Track, Limassol" — the label and the destination name. */
  label: string;
  height?: number;
}

export function MeetMap({ lat, lng, label, height = 130 }: MeetMapProps) {
  const p = usePalette();

  const tiles = useMemo(() => {
    if (lat === null || lng === null) return null;

    // Assume a full-bleed band inside the 16px gutters of a 390pt screen. Tiles
    // are laid out from the centre, so an over-estimate only costs one column.
    const width = 390 - 32;
    const { x: cx, y: cy, n } = project(lat, lng, ZOOM);

    const left = cx - width / 2;
    const top = cy - height / 2;

    const firstX = Math.floor(left / TILE_SIZE);
    const lastX = Math.floor((left + width) / TILE_SIZE);
    const firstY = Math.floor(top / TILE_SIZE);
    const lastY = Math.floor((top + height) / TILE_SIZE);

    const out: { key: string; uri: string; left: number; top: number }[] = [];
    for (let tx = firstX; tx <= lastX; tx += 1) {
      for (let ty = firstY; ty <= lastY; ty += 1) {
        // Wrap horizontally at the date line; clamp vertically at the poles.
        const wrappedX = ((tx % n) + n) % n;
        if (ty < 0 || ty >= n) continue;
        out.push({
          key: `${tx}-${ty}`,
          uri: TILE_URL(ZOOM, wrappedX, ty),
          left: tx * TILE_SIZE - left,
          top: ty * TILE_SIZE - top,
        });
      }
    }
    return out;
  }, [lat, lng, height]);

  if (!tiles) {
    return <Placeholder label={t('run.mapPlaceholder', { place: label })} height={height} />;
  }

  const openInMaps = () => {
    const query = encodeURIComponent(label);
    const url = Platform.select({
      ios: `maps://?ll=${lat},${lng}&q=${query}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${query})`,
      default: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
    });
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Pressable
      onPress={openInMaps}
      accessibilityRole="button"
      accessibilityLabel={t('run.meetMapLabel', { place: label })}
      style={({ pressed }) => [
        styles.wrap,
        { height, borderColor: p.hairline, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.tiles}>
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={{ uri: t.uri }}
            style={[styles.tile, { left: t.left, top: t.top }]}
            accessibilityIgnoresInvertColors
          />
        ))}
      </View>

      {/* Square marker — the app has no rounded shapes and no icon set. */}
      <View style={styles.markerWrap} pointerEvents="none">
        <View style={styles.marker} />
        <View style={styles.markerStem} />
      </View>

      <View style={[styles.caption, { backgroundColor: p.paper }]} pointerEvents="none">
        <Txt role="appLabel" muted>
          {t('run.meetMap')}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
  tiles: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    // Matches the grayscale treatment the design gives photography and maps.
    ...grayscale(1.05),
  },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
  markerWrap: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 14,
    height: 14,
    backgroundColor: brand.accent,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerStem: { width: 2, height: 10, backgroundColor: brand.accent },
  caption: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
