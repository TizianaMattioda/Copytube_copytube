import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';

function Page1A() {
  const navigation = useNavigation();
  const route = useRoute();
  const { text } = route.params || { text: 'Open up App.js to start working on your app!' };

  return (
    <View style={styles.container}>
      <Text>{text}</Text>
      <StatusBar style="auto" />
      <TouchableOpacity onPress={() => navigation.navigate('name2')} style={styles.button}>Change page</TouchableOpacity>
    </View>
  );
}

function Page2A() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

function Page1B() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

function Page2B() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// Pestaña de Descargas (vacía)
function DownloadsTab() {
  return (
    <View style={styles.container}>
      <Text>Pestaña de Descargas</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// Pestaña de Video
function VideoTab() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      loadVideos();
    }
  };

  const loadVideos = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });
      setVideos(media.assets);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los videos');
    }
  };

  const playVideo = async (video) => {
    setSelectedVideo(video);
    if (videoRef) {
      await videoRef.playAsync();
      setIsPlaying(true);
    }
  };

  const pauseVideo = async () => {
    if (videoRef) {
      await videoRef.pauseAsync();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = async () => {
    if (videoRef) {
      await videoRef.presentFullscreenPlayer();
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Se necesita permiso para acceder a los videos</Text>
        <TouchableOpacity onPress={requestPermissions} style={styles.button}>
          <Text>Solicitar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reproductor de Video</Text>
      
      {selectedVideo && (
        <View style={styles.videoContainer}>
          <Video
            ref={setVideoRef}
            style={styles.video}
            source={{ uri: selectedVideo.uri }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={(status) => {
              setIsPlaying(status.isPlaying);
            }}
          />
          <View style={styles.videoControls}>
            <TouchableOpacity onPress={isPlaying ? pauseVideo : () => playVideo(selectedVideo)} style={styles.controlButton}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
              <Ionicons name="expand" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.mediaItem}
            onPress={() => setSelectedVideo(item)}
          >
            <Text style={styles.mediaText}>{item.filename}</Text>
            <TouchableOpacity onPress={() => playVideo(item)} style={styles.playButton}>
              <Ionicons name="play" size={20} color="#007AFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        style={styles.mediaList}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}

// Pestaña de Audio
function AudioTab() {
  const [sounds, setSounds] = useState([]);
  const [selectedSound, setSelectedSound] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      loadAudio();
    }
  };

  const loadAudio = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });
      setSounds(media.assets);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los archivos de audio');
    }
  };

  const playSound = async (audio) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audio.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setSelectedSound(audio);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        setIsPlaying(status.isPlaying);
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Se necesita permiso para acceder a los archivos de audio</Text>
        <TouchableOpacity onPress={requestPermissions} style={styles.button}>
          <Text>Solicitar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reproductor de Audio</Text>
      
      {selectedSound && (
        <View style={styles.audioContainer}>
          <Text style={styles.audioTitle}>{selectedSound.filename}</Text>
          <View style={styles.audioControls}>
            <TouchableOpacity 
              onPress={isPlaying ? pauseSound : resumeSound} 
              style={styles.audioControlButton}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={sounds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.mediaItem}
            onPress={() => setSelectedSound(item)}
          >
            <Text style={styles.mediaText}>{item.filename}</Text>
            <TouchableOpacity onPress={() => playSound(item)} style={styles.playButton}>
              <Ionicons name="play" size={20} color="#007AFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        style={styles.mediaList}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}

const StackPage1 = createNativeStackNavigator()
const StackPage2 = createNativeStackNavigator()

function StackPage1Navigator() {
  return (
    <StackPage1.Navigator>
      <StackPage1.Screen name="name1" component={Page1A} />
      <StackPage1.Screen name="name2" component={Page1B} />
    </StackPage1.Navigator>
  )
}

function StackPage2Navigator() {
  return (
    <StackPage2.Navigator>
      <StackPage2.Screen name="name3" component={Page2A} />
      <StackPage2.Screen name="name4" component={Page2B} />
    </StackPage2.Navigator>
  )
}

const Tab = createBottomTabNavigator();
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Descargas"
        component={DownloadsTab}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="download" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideoTab}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="videocam" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Audio"
        component={AudioTab}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  videoContainer: {
    width: '90%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 25,
  },
  audioContainer: {
    width: '90%',
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  audioControlButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
  },
  mediaList: {
    width: '90%',
    maxHeight: 300,
  },
  mediaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    marginBottom: 5,
    borderRadius: 5,
  },
  mediaText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  playButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
});
