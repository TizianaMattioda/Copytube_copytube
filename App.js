import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, TextInput, Button } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { fetch } from 'expo/fetch';

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
  const [text, setText] = useState('');

  const handleChange = (text) => {
    setText({text});
  }

  async function download(){
    // Usar la URL del input o la URL por defecto
    const downloadUrl = text && text.text ? text.text : 'https://peertube.tv/download/videos/9b592401-e6d7-4b3d-b60c-03f4fd5d0b34-144.mp4';
    
    try {
      
      // Validar URL
      if (!downloadUrl || downloadUrl.trim() === '') {
        Alert.alert('Error', 'Por favor ingresa una URL válida');
        return;
      }
      
      // Crear directorio temporal para la descarga
      const tempDir = FileSystem.cacheDirectory + 'temp_downloads/';
      
      // Verificar si el directorio temporal existe, si no, crearlo
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }
      
      // Generar un nombre de archivo único basado en timestamp
      const timestamp = new Date().getTime();
      const urlParts = downloadUrl.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Obtener extensión sin parámetros
      const fileName = `download_${timestamp}.${extension}`;
      const tempFilePath = tempDir + fileName;
      
      // Determinar si es audio o video basado en la extensión
      const audioExtensions = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg', 'wma', 'opus'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'];
      const extensionLower = extension.toLowerCase();
      
      const isAudio = audioExtensions.includes(extensionLower);
      const isVideo = videoExtensions.includes(extensionLower);
      
      console.log('Descargando desde:', downloadUrl);
      console.log('Descargando temporalmente a:', tempFilePath);
      console.log('Tipo de archivo:', isAudio ? 'Audio' : isVideo ? 'Video' : 'Desconocido');
      
      // Descargar el archivo a ubicación temporal
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFilePath);
      
      console.log('Descarga completada:', downloadResult.status === 200);
      console.log('Archivo temporal en:', downloadResult.uri);
      
      // Verificar que la descarga fue exitosa
      if (downloadResult.status === 200) {
        let storageLocation;
        let finalDir;
        
        // Definir carpeta según tipo de archivo
        if (isAudio) {
          finalDir = FileSystem.documentDirectory + 'CopyTube/Audio/';
          storageLocation = '🎵 CopyTube → Audio';
        } else if (isVideo) {
          finalDir = FileSystem.documentDirectory + 'CopyTube/Video/';
          storageLocation = '🎬 CopyTube → Video';
        } else {
          finalDir = FileSystem.documentDirectory + 'CopyTube/Files/';
          storageLocation = '📱 CopyTube → Files';
        }
        
        // Crear directorio si no existe
        const dirInfo = await FileSystem.getInfoAsync(finalDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(finalDir, { intermediates: true });
        }
        
        // Mover archivo desde temp a carpeta final
        const finalPath = finalDir + fileName;
        await FileSystem.moveAsync({
          from: downloadResult.uri,
          to: finalPath
        });
        
        console.log('Archivo guardado en:', finalPath);
        
        // Obtener información del archivo desde su ubicación final
        const fileInfo = await FileSystem.getInfoAsync(finalPath);
        const sizeInMB = Math.round(fileInfo.size / 1024 / 1024 * 100) / 100;
        
        const fileType = isAudio ? 'Audio' : isVideo ? 'Video' : 'Archivo';
        
        Alert.alert(
          'Éxito', 
          `${fileType} descargado exitosamente:\n${fileName}\nTamaño: ${sizeInMB} MB\n\nGuardado en:\n${storageLocation}`
        );
        
        // Limpiar archivo temporal
        await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
        
      } else {
        Alert.alert('Error', 'No se pudo descargar el archivo');
      }
      
    } catch (error) {
      console.error('Error en la descarga:', error);
      Alert.alert('Error', `No se pudo descargar el archivo: ${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Descargar Videos</Text>
      <Text style={styles.subtitle}>Ingresa la URL del video que quieres descargar:</Text>
      <TextInput
        underlineColorAndroid="transparent"
        style={styles.input}
        onChangeText={handleChange}
        value={text}
        placeholder="https://ejemplo.com/video.mp4"
        multiline={false}
      />
      <TouchableOpacity style={styles.downloadButton} onPress={download}>
        <Ionicons name="download" size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Descargar</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Si no ingresas una URL, se descargará un video de ejemplo.</Text>
      <Text style={styles.note}>🎵 Audio: CopyTube → Audio</Text>
      <Text style={styles.note}>🎬 Video: CopyTube → Video</Text>
      <Text style={styles.note}>Los archivos se guardan en el almacenamiento interno de la app</Text>
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

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const videoDir = FileSystem.documentDirectory + 'CopyTube/Video/';
      
      // Verificar si la carpeta existe
      const dirInfo = await FileSystem.getInfoAsync(videoDir);
      
      if (dirInfo.exists) {
        // Leer archivos de la carpeta
        const files = await FileSystem.readDirectoryAsync(videoDir);
        
        // Filtrar solo archivos de video y crear objetos con la estructura necesaria
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'];
        const videoFiles = files
          .filter(file => {
            const ext = file.split('.').pop().toLowerCase();
            return videoExtensions.includes(ext);
          })
          .map(file => ({
            filename: file,
            uri: videoDir + file,
            id: file
          }));
        
        setVideos(videoFiles);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error cargando videos:', error);
      Alert.alert('Error', 'No se pudieron cargar los videos: ' + error.message);
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

  useEffect(() => {
    loadAudio();
  }, []);

  const loadAudio = async () => {
    try {
      const audioDir = FileSystem.documentDirectory + 'CopyTube/Audio/';
      
      // Verificar si la carpeta existe
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (dirInfo.exists) {
        // Leer archivos de la carpeta
        const files = await FileSystem.readDirectoryAsync(audioDir);
        
        // Filtrar solo archivos de audio y crear objetos con la estructura necesaria
        const audioExtensions = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg', 'wma', 'opus'];
        const audioFiles = files
          .filter(file => {
            const ext = file.split('.').pop().toLowerCase();
            return audioExtensions.includes(ext);
          })
          .map(file => ({
            filename: file,
            uri: audioDir + file,
            id: file
          }));
        
        setSounds(audioFiles);
      } else {
        setSounds([]);
      }
    } catch (error) {
      console.error('Error cargando audios:', error);
      Alert.alert('Error', 'No se pudieron cargar los archivos de audio: ' + error.message);
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
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '90%',
    borderRadius: 5,
    borderColor: '#ddd',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  permissionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  }
});
