/**
 * Photo storage.
 *
 * The bucket is private — the clan is a membership, and every other read in this
 * schema requires a session — so images are fetched through signed URLs rather
 * than public links. Signing is batched per screen and cached until shortly
 * before expiry, so scrolling the feed doesn't sign the same path repeatedly.
 *
 * Uploads are downscaled on the device first. A modern phone camera produces
 * 4–8 MB per frame; the design shows a 190px-tall block, and the data model
 * asks for a ~1080px derivative.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export const BUCKET = 'photos';

/** Paths the seed writes before any real photograph exists. */
export function isPlaceholder(path: string | null | undefined): boolean {
  return !path || path.startsWith('placeholder://');
}

/** The label a placeholder carries — "photo — sunrise at Molos". */
export function placeholderLabel(path: string): string {
  return path.replace('placeholder://', '');
}

const SIGNED_TTL_SECONDS = 3600;
/** Re-sign a minute early so a URL can't expire mid-render. */
const REFRESH_MARGIN_MS = 60_000;

const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Signs a batch of storage paths. Placeholders and already-cached paths are
 * skipped, so this is cheap to call on every render pass.
 */
export async function signPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const result = new Map<string, string>();
  const needed: string[] = [];

  for (const path of paths) {
    if (isPlaceholder(path)) continue;
    const hit = cache.get(path);
    if (hit && hit.expiresAt - REFRESH_MARGIN_MS > now) {
      result.set(path, hit.url);
    } else if (!needed.includes(path)) {
      needed.push(path);
    }
  }

  if (needed.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(needed, SIGNED_TTL_SECONDS);

  if (error || !data) return result;

  for (const row of data) {
    if (row.signedUrl && row.path) {
      cache.set(row.path, { url: row.signedUrl, expiresAt: now + SIGNED_TTL_SECONDS * 1000 });
      result.set(row.path, row.signedUrl);
    }
  }

  return result;
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

export type PickResult =
  | { status: 'picked'; photo: PickedPhoto }
  | { status: 'cancelled' }
  | { status: 'denied'; canAskAgain: boolean };

/**
 * Opens the photo library.
 *
 * Returns why nothing was picked rather than a bare null: a denied permission
 * and a cancelled picker look identical to the caller otherwise, and a silent
 * return makes the button look broken — which is exactly how it failed when the
 * iOS usage description was missing.
 */
export async function pickPhoto(): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied', canAskAgain: permission.canAskAgain };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    // The feed crops to a 190px band, so a portrait frame would be cut anyway.
    // Ignored on web, where the browser's own file dialog has no crop step.
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled || result.assets.length === 0) return { status: 'cancelled' };

  const asset = result.assets[0];
  return {
    status: 'picked',
    photo: { uri: asset.uri, width: asset.width, height: asset.height },
  };
}

/**
 * Downscales to 1080px wide and uploads into the caller's own folder.
 * Returns the storage path to hand to api_create_post.
 */
export async function uploadPostPhoto(
  photo: PickedPhoto,
  memberId: string,
): Promise<{ path: string; width: number; height: number }> {
  const context = ImageManipulator.ImageManipulator.manipulate(photo.uri);
  if (photo.width > 1080) context.resize({ width: 1080 });

  const rendered = await context.renderAsync();
  const output = await rendered.saveAsync({
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const response = await fetch(output.uri);
  const bytes = await response.arrayBuffer();

  // The folder is the member id — the storage policy checks exactly this.
  const path = `posts/${memberId}/${Date.now()}-${Math.round(photo.width)}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    path,
    width: output.width ?? photo.width,
    height: output.height ?? photo.height,
  };
}
