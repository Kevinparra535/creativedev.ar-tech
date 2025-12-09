import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import { TabParamList } from "./types";

import { HomeScreen } from "@/ui/screens/HomeScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />
    </Tab.Navigator>
  );
}
