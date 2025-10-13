import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, TextInput, Button } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
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
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleChange = (text) => {
    setText({text});
  }

  async function download(){
    // Usar la URL del input o la URL por defecto
    const downloadUrl = text && text.text ? text.text : 'https://peertube.tv/download/videos/90eee9f5-994d-471b-9374-4c3beb5a54cb-1080.mp4';
    
    try {
      // Validar URL
      if (!downloadUrl || downloadUrl.trim() === '') {
        Alert.alert('Error', 'Por favor ingresa una URL válida');
        return;
      }
      
      // Generar un nombre de archivo único basado en timestamp
      const timestamp = new Date().getTime();
      const urlParts = downloadUrl.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Obtener extensión sin parámetros
      const fileName = `download_${timestamp}.${extension}`;
      
      console.log('Descargando desde:', downloadUrl);
      console.log('Nombre del archivo:', fileName);
      
      // Usar DocumentPicker para permitir al usuario elegir dónde guardar
      try {
        // Primero descargamos a una ubicación temporal
        const tempDir = FileSystem.cacheDirectory + 'temp_downloads/';
        
        // Verificar si el directorio temporal existe, si no, crearlo
        const dirInfo = await FileSystem.getInfoAsync(tempDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
        }
        
        const tempFilePath = tempDir + fileName;
        
        console.log('Descargando temporalmente a:', tempFilePath);
        
        // Descargar el archivo a ubicación temporal
        const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFilePath);
        
        console.log('Descarga completada:', downloadResult.status === 200);
        
        // Verificar que la descarga fue exitosa
        if (downloadResult.status === 200) {
          // Obtener información del archivo
          const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
          const sizeInMB = Math.round(fileInfo.size / 1024 / 1024 * 100) / 100;
          
          // Guardar directamente en Downloads/Copytube
          try {
            await saveToDownloads(downloadResult.uri, fileName, sizeInMB);
            await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
          } catch (error) {
            Alert.alert('Error', 'No se pudo guardar en Downloads');
            await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
          }
          
        } else {
          Alert.alert('Error', 'No se pudo descargar el archivo');
        }
        
      } catch (error) {
        console.error('Error en la descarga:', error);
        Alert.alert('Error', `No se pudo descargar el archivo: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', `Error inesperado: ${error.message}`);
    }
  }
  
  const getMimeFromExtension = (ext) => {
    const lower = (ext || '').toLowerCase();
    if (lower === 'mp4') return 'video/mp4';
    if (lower === 'webm') return 'video/webm';
    if (lower === 'mkv') return 'video/x-matroska';
    if (lower === 'mp3') return 'audio/mpeg';
    if (lower === 'm4a') return 'audio/mp4';
    if (lower === 'wav') return 'audio/wav';
    return 'application/octet-stream';
  };

  // Función para obtener archivos de la carpeta de descargas
  const getDownloadedFiles = async (mediaType = 'all') => {
    const PERSISTED_URI_FILE = FileSystem.documentDirectory + 'copytube_downloads_dir.txt';
    
    try {
      // Verificar si hay ubicación persistida
      const persistedInfo = await FileSystem.getInfoAsync(PERSISTED_URI_FILE);
      if (!persistedInfo.exists) {
        return []; // No hay carpeta de descargas configurada
      }
      
      const targetDirUri = await FileSystem.readAsStringAsync(PERSISTED_URI_FILE);
      
      // Listar archivos en la carpeta
      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(targetDirUri);
      
      // Filtrar por tipo de media
      const filteredFiles = files.filter(file => {
        const ext = file.split('.').pop()?.toLowerCase();
        
        if (mediaType === 'video') {
          return ['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext);
        } else if (mediaType === 'audio') {
          return ['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext);
        }
        return true; // 'all'
      });
      
      // Convertir a formato compatible con MediaLibrary
      return filteredFiles.map(file => ({
        id: file,
        filename: file,
        uri: targetDirUri + '/' + file,
        mediaType: mediaType === 'video' ? 'video' : 'audio'
      }));
      
    } catch (error) {
      console.error('Error obteniendo archivos descargados:', error);
      return [];
    }
  };

  const saveToDownloads = async (fileUri, fileName, sizeInMB) => {
    const PERSISTED_URI_FILE = FileSystem.documentDirectory + 'copytube_downloads_dir.txt';
    
    try {
      let targetDirUri = null;
      
      // Intentar leer la ubicación persistida
      const persistedInfo = await FileSystem.getInfoAsync(PERSISTED_URI_FILE);
      if (persistedInfo.exists) {
        try {
          targetDirUri = await FileSystem.readAsStringAsync(PERSISTED_URI_FILE);
        } catch (error) {
          console.log('Error leyendo ubicación persistida:', error);
        }
      }
      
      // Si no hay ubicación persistida o es inválida, pedir al usuario seleccionar
      if (!targetDirUri) {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (!permission.granted) {
          throw new Error('Permiso de carpeta denegado');
        }
        
        targetDirUri = permission.directoryUri;
        
        // Guardar la ubicación para futuros usos
        await FileSystem.writeAsStringAsync(PERSISTED_URI_FILE, targetDirUri);
      }

      // Elegir mime por extensión
      const ext = (fileName.split('.').pop() || '').split('?')[0];
      const mimeType = getMimeFromExtension(ext);

      // Crear el archivo en la carpeta seleccionada
      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        targetDirUri,
        fileName,
        mimeType
      );

      // Para archivos grandes, usar copyAsync en lugar de leer todo en memoria
      await FileSystem.copyAsync({
        from: fileUri,
        to: destUri
      });

      Alert.alert('Éxito', `Archivo guardado exitosamente:\n\n${fileName} (${sizeInMB} MB)`);
      
    } catch (error) {
      console.error('Error guardando archivo:', error);
      throw error;
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Descargar Videos</Text>
        <Text style={styles.subtitle}>Se necesitan permisos para guardar archivos</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Ionicons name="shield-checkmark" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Solicitar Permisos</Text>
        </TouchableOpacity>
        <Text style={styles.note}>La primera vez elegirás dónde guardar. Después se recordará la ubicación.</Text>
        <StatusBar style="auto" />
      </View>
    );
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
      <Text style={styles.note}>La primera vez elegirás dónde guardar. Después se recordará la ubicación.</Text>
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
      // Cargar videos de la galería
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });
      
      // Obtener videos descargados
      const downloadedVideos = await getDownloadedFiles('video');
      
      // Combinar videos de galería y descargados
      const allVideos = [...media.assets, ...downloadedVideos];
      
      setVideos(allVideos);
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
      // Cargar audio de la galería
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });
      
      // Obtener audios descargados
      const downloadedAudio = await getDownloadedFiles('audio');
      
      // Combinar audio de galería y descargados
      const allAudio = [...media.assets, ...downloadedAudio];
      
      setSounds(allAudio);
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
