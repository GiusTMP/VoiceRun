import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { colors } from '../styles/global';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabs,
          borderTopColor: colors.surface,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
             <Image
                source={require('../../assets/images/run-image.png')}
                style={{
                width: size,
                height: size,
                tintColor: color,
                }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='history'
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='reader-outline' size={size} color={color} />
          ),
        }}
      />
    
    </Tabs>
  );
}
