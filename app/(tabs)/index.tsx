import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FortyTwoApiError,
  type FortyTwoUser,
  getUserByLogin,
} from "@/services/oauth";
import { Radius, Spacing, useGlobalStyles } from "@/styles";

function mapErrorToMessage(error: unknown) {
  if (error instanceof FortyTwoApiError) {
    if (error.code === "USER_NOT_FOUND") return "Login introuvable";
    if (error.code === "NETWORK_ERROR")
      return "Erreur reseau, verifie ta connexion";
    if (error.code === "CONFIG_ERROR")
      return "Configuration API manquante dans .env.local";
    if (error.code === "AUTH_ERROR")
      return "Impossible d'obtenir le token OAuth";
    return "Erreur API, reessaie dans un instant";
  }
  return "Une erreur inattendue est survenue";
}

function getDisplayedLevel(user: FortyTwoUser) {
  const mainCursus =
    user.cursus_users.find((cursus) => cursus.cursus_id === 21) ??
    user.cursus_users[0];
  return typeof mainCursus?.level === "number"
    ? mainCursus.level.toFixed(2)
    : "N/A";
}

export default function SearchScreen() {
  const [login, setLogin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<FortyTwoUser | null>(null);

  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const g = useGlobalStyles();
  const canSearch = login.trim().length > 0 && !isLoading;

  async function handleSearch() {
    if (!canSearch) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getUserByLogin(login);
      setUser(result);
    } catch (error) {
      setUser(null);
      setErrorMessage(mapErrorToMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={g.screen} edges={["top"]}>
      <View style={styles.headerBlock}>
        <ThemedText type="title">Swifty Companion</ThemedText>
        <ThemedText style={{ color: palette.textSecondary }}>
          Recherche un etudiant 42 par son login
        </ThemedText>
      </View>

      <View style={[g.glassCardElevated, styles.searchCard]}>
        <View style={styles.searchRow}>
          <TextInput
            value={login}
            onChangeText={setLogin}
            placeholder="ex: ton login 42"
            placeholderTextColor={palette.inputPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={[
              g.glassInput,
              styles.input,
              isInputFocused ? g.glassInputFocused : undefined,
            ]}
          />
          <Pressable
            onPress={handleSearch}
            disabled={!canSearch}
            style={({ pressed }) => [
              g.glassButtonPrimary,
              styles.searchButton,
              pressed && canSearch ? g.glassButtonPrimaryPressed : undefined,
              !canSearch ? styles.searchButtonDisabled : undefined,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <IconSymbol
                name="magnifyingglass"
                size={18}
                color={palette.text}
              />
            )}
          </Pressable>
        </View>
      </View>

      {errorMessage ? (
        <View style={[g.glassCard, styles.errorCard]}>
          <ThemedText style={{ color: "#dc2626" }}>{errorMessage}</ThemedText>
        </View>
      ) : null}

      {user ? (
        <View style={[g.glassCard, styles.previewCard]}>
          <ThemedText type="subtitle">Preview profil</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Login</ThemedText>
            <ThemedText type="defaultSemiBold">{user.login}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText type="defaultSemiBold">
              {user.email || "N/A"}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Wallet</ThemedText>
            <ThemedText type="defaultSemiBold">{user.wallet}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Location</ThemedText>
            <ThemedText type="defaultSemiBold">
              {user.location ?? "Unavailable"}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Level</ThemedText>
            <ThemedText type="defaultSemiBold">
              {getDisplayedLevel(user)}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: Spacing.xs,
  },
  searchCard: {
    gap: Spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
  },
  searchButton: {
    minWidth: 52,
    width: 52,
    borderRadius: Radius.lg,
    paddingHorizontal: 0,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  errorCard: {
    borderColor: "rgba(220, 38, 38, 0.25)",
  },
  previewCard: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabel: {
    opacity: 0.75,
  },
});
