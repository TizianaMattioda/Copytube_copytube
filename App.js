import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
        name="Page1"
        component={StackPage1Navigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Page2"
        component={StackPage2Navigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
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
});
