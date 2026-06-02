import { useAppTheme } from "@/hooks/use-app-theme";
import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type ShapesVariant = "auth" | "employee" | "supervisor" | "splash";

interface ShapeConfig {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  borderRadius: number;
  colorKey: "primary" | "secondary";
  opacity: number;
}

function getShapesForVariant(variant: ShapesVariant): ShapeConfig[] {
  switch (variant) {
    case "auth":
      return [
        { top: -100, right: -60, width: 260, height: 260, borderRadius: 130, colorKey: "primary", opacity: 0.06 },
        { bottom: -80, left: -50, width: 220, height: 140, borderRadius: 110, colorKey: "secondary", opacity: 0.07 },
        { top: SCREEN_WIDTH * 0.45, left: -40, width: 120, height: 120, borderRadius: 60, colorKey: "primary", opacity: 0.05 },
        { top: 40, left: -30, width: 160, height: 80, borderRadius: 80, colorKey: "secondary", opacity: 0.05 },
      ];
    case "employee":
      return [
        { top: -80, left: -40, width: 200, height: 200, borderRadius: 100, colorKey: "primary", opacity: 0.05 },
        { bottom: -100, right: -50, width: 240, height: 130, borderRadius: 120, colorKey: "secondary", opacity: 0.06 },
        { top: SCREEN_WIDTH * 0.5, right: -30, width: 100, height: 100, borderRadius: 50, colorKey: "primary", opacity: 0.04 },
      ];
    case "supervisor":
      return [
        { top: -60, right: -50, width: 220, height: 220, borderRadius: 110, colorKey: "primary", opacity: 0.05 },
        { bottom: -70, left: -40, width: 200, height: 120, borderRadius: 100, colorKey: "secondary", opacity: 0.06 },
        { bottom: SCREEN_WIDTH * 0.3, right: -20, width: 90, height: 90, borderRadius: 45, colorKey: "primary", opacity: 0.04 },
      ];
    case "splash":
      return [
        { top: -120, right: -80, width: 300, height: 300, borderRadius: 150, colorKey: "primary", opacity: 0.08 },
        { bottom: -100, left: -60, width: 260, height: 160, borderRadius: 130, colorKey: "secondary", opacity: 0.08 },
        { top: SCREEN_WIDTH * 0.3, left: -50, width: 140, height: 140, borderRadius: 70, colorKey: "primary", opacity: 0.05 },
      ];
  }
}

interface DecorativeShapesProps {
  variant?: ShapesVariant;
}

export default function DecorativeShapes({ variant = "auth" }: DecorativeShapesProps) {
  const colors = useAppTheme();
  const shapes = getShapesForVariant(variant);

  return (
    <View style={styles.container} pointerEvents="none">
      {shapes.map((shape, index) => (
        <View
          key={index}
          style={[
            styles.shape,
            {
              top: shape.top,
              bottom: shape.bottom,
              left: shape.left,
              right: shape.right,
              width: shape.width,
              height: shape.height,
              borderRadius: shape.borderRadius,
              backgroundColor: colors[shape.colorKey],
              opacity: shape.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shape: {
    position: "absolute",
  },
});
