import React, { useCallback, useReducer, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  AudioSession,
  Event,
  FullscreenHandler,
  PlayerView,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { RootStackParamsList } from '../App';
import Orientation from 'react-native-orientation-locker';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Button from '../components/Button';
import FormInput from '../components/FormInput';

type LandscapeFullscreenHandlingProps = NativeStackScreenProps<
  RootStackParamsList,
  'LandscapeFullscreenHandling'
>;

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

interface State {
  parentalControl: string;
}

enum FormAction {
  SET_PARENTAL_CONTROL = 'SET_PARENTAL_CONTROL',
}

interface Action {
  type: FormAction;
  payload: any;
}
function formReducer(state: State, action: Action): State {
  const { type, payload } = action;
  let newState = state;

  switch (type) {
    case FormAction.SET_PARENTAL_CONTROL:
      newState = { ...newState, parentalControl: payload as string };
      break;
  }

  return newState;
}

const setParentalControl = (payload: string): Action => ({
  type: FormAction.SET_PARENTAL_CONTROL,
  payload,
});

// initial state
const initialFormState = {
  parentalControl: '',
};

class SampleFullscreenHandler implements FullscreenHandler {
  isFullscreenActive: boolean = true;
  onFullscreen: (fullscreenMode: boolean) => void;

  constructor(
    isFullscreenActive: boolean,
    onFullscreen: (fullscreenMode: boolean) => void
  ) {
    this.isFullscreenActive = isFullscreenActive;
    this.onFullscreen = onFullscreen;
  }

  enterFullscreen(): void {
    this.isFullscreenActive = true;
    if (Platform.OS === 'android') {
      // Hides navigation and status bar on Android
      SystemNavigationBar.stickyImmersive(true);
    } else {
      // Hides status bar on iOS
      StatusBar.setHidden(true);
    }
    Orientation.lockToLandscape();
    console.log('enter fullscreen');
    this.onFullscreen(true);
  }

  exitFullscreen(): void {
    this.isFullscreenActive = false;
    if (Platform.OS === 'android') {
      // shows navigation and status bar on Android
      SystemNavigationBar.stickyImmersive(false);
    } else {
      // shows status bar on iOS
      StatusBar.setHidden(false);
    }
    Orientation.unlockAllOrientations();
    console.log('exit fullscreen');
    this.onFullscreen(false);
  }
}

export default function LandscapeFullscreenHandling({
  navigation,
}: LandscapeFullscreenHandlingProps) {
  useTVGestures();

  const player = usePlayer({
    licenseKey: '2ab6b979-f679-4c7d-8a18-b455e6e6992b',
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });

  const [fullscreenMode, setFullscreenMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const fullscreenHandler = useRef(
    new SampleFullscreenHandler(fullscreenMode, (isFullscreen: boolean) => {
      console.log('on fullscreen change');
      setFullscreenMode(isFullscreen);
      navigation.setOptions({ headerShown: !isFullscreen });
    })
  ).current;
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
          "[LandscapeFullscreen] Failed to set app's audio category to `playback`:\n",
          error
        );
      });
      // Load desired source configuration
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
            : 'https://bitdash-a.akamaihd.net/content/sintel/sintel.mpd',

        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Sintel',
        poster:
          'https://www.cartoonbrew.com/wp-content/uploads/2014/04/sintel-sony-1280x600.jpg',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );
  useFocusEffect(
    useCallback(() => {
      return () => {
        fullscreenHandler.exitFullscreen();
      };
    }, [fullscreenHandler])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onError = useCallback(() => {
    setFullscreenMode(false);
  }, []);

  const loadVideo = useCallback(() => {
    player.load({
      url:
        Platform.OS === 'ios'
          ? 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
          : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
      type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,

      title: 'Art of Motion',
      poster:
        'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
    });
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Button type="solid" onPress={() => navigation.goBack()} title="Back" />
      </View>
      <View style={[styles.button, { marginTop: 140 }]}>
        <Button
          type="solid"
          onPress={() => {
            player.pause();
            setIsVisible(true);
          }}
          title="Next Episode"
        />
      </View>
      <PlayerView
        player={player}
        isFullscreenRequested={fullscreenMode}
        style={fullscreenMode ? styles.playerFullscreen : styles.player}
        fullscreenHandler={fullscreenHandler}
        onFullscreenEnter={onEvent}
        onFullscreenExit={onEvent}
        onFullscreenEnabled={onEvent}
        onFullscreenDisabled={onEvent}
        onPlayerError={onError}
        onSourceError={onError}
      />
      <Modal
        visible={isVisible}
        animationType="fade"
        presentationStyle="fullScreen"
      >
        <View style={styles.button}>
          <Button
            type="solid"
            onPress={() => {
              setIsVisible(false);
            }}
            title="Close Modal"
          />
        </View>
        <View style={styles.modal}>
          <Text>Modal</Text>
          <FormInput
            title="Parental Control"
            value={state.parentalControl}
            onChange={(value) => dispatch(setParentalControl(value))}
          />
          <Button
            type="solid"
            onPress={() => {
              setIsVisible(false);
              loadVideo();
            }}
            title="Done"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  button: {
    position: 'absolute',
    left: 0,
    top: 0,
    marginVertical: 80,
    marginHorizontal: 20,
    zIndex: 1,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
  playerFullscreen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'black',
  },
  modal: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
