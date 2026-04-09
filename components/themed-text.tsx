import { StyleSheet, Text, type TextProps } from "react-native";

import { Fonts } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Typography } from "@/styles/tokens";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const linkColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "link",
  );

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "link" ? { color: linkColor } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.sans,
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    letterSpacing: Typography.letterSpacing.body,
  },
  defaultSemiBold: {
    fontFamily: Fonts.sans,
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: "600",
    letterSpacing: Typography.letterSpacing.body,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: Typography.size.title,
    fontWeight: "600",
    lineHeight: Typography.lineHeight.title,
    letterSpacing: Typography.letterSpacing.title,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: Typography.size.subtitle,
    fontWeight: "600",
    lineHeight: Typography.lineHeight.subtitle,
    letterSpacing: Typography.letterSpacing.subtitle,
  },
  link: {
    lineHeight: 30,
    fontSize: Typography.size.body,
    fontFamily: Fonts.sans,
    textDecorationLine: "none",
    letterSpacing: Typography.letterSpacing.link,
  },
});
