import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AudioSession,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function BasicPictureInPicture() {
  useTVGestures();

  const player = usePlayer({
    licenseKey: 'LICENSE_KEY',
    playbackConfig: {
      // Enable picture in picture UI option on player controls.
      isPictureInPictureEnabled: true,
    },
  });

  useFocusEffect(
    useCallback(() => {
      // iOS audio session must be set to `playback` first otherwise PiP mode won't work.
      //
      // Usually it's desireable to set the audio's category only once during your app's main component
      // initialization. This way you can guarantee that your app's audio category is properly
      // configured throughout the whole lifecycle of the application.
      AudioSession.setCategory('playback').catch((error) => {
        // Handle any native errors that might occur while setting the audio's category.
        console.log(
          "[BasicPictureInPicture] Failed to set app's audio category to `playback`:\n",
          error
        );
      });

      // Load desired source configuration
      player.load({
        url:
          Platform.OS === 'ios'
            ? // TODO: Replace this URL with the updated URL
              'https://vod-hls-ntham-comm.live.cf.md.bbci.co.uk/usp/auth/vod/piff_abr_full_hd/c35a1b-p09pz01c/vf_p09pz01c_5a49a126-cbd5-46fd-8e7c-e8b6c6685257.ism/mobile_wifi_main_sd_abr_v2_hls_master.m3u8?Expires=1726619408&Signature=jJIeprDXiYDp6uSc2S~sX78PquboG5iul3MUXt-DLnXe54AK-tCwRN66gwGknQhVvNC6e5O4XsGXbLwBkeCNbvNOkMM7d2VoKMXNwXKiPtAQmI~bpxsdGpyCj5OWAGhC6xrrzY0SLZ~ncNrm-EMobTJNoNdNINgHTcwxp2pZyCDuWnL8y03LlNBqkt8dNCEU3atbfp9zOK4Tys~qV84~7M33pZso7l3JBhf4rsP0Akx8VoMkOBLru55MSYs2uptIf-7PwjXwo2uKYlctIqe~ZaHjYlYoUPnaadDcRF4EvEdYxMcgaeLevAFVgGOW7sRJkE6UPn4lYJOly-dyW9Oy2g__&Key-Pair-Id=K2VWLYKQ4HU1FJ'
            : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onEventError = (event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  };

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPictureInPictureAvailabilityChanged={onEvent}
        onPictureInPictureEnter={onEvent}
        onPictureInPictureEntered={onEvent}
        onPictureInPictureExit={onEvent}
        onPictureInPictureExited={onEvent}
        onSourceError={onEventError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
});
