import { useEffect, useState } from "react";
import { SimpleGrid, Stat, StatLabel, StatNumber, Box, Heading, Text, useColorModeValue, HStack, Button } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { getDealsMetrics } from "../lib/api";
import { useI18n } from "../useI18n";

type StageCount = { stage_id: number; name: string; count: number };
type StatusCount = { status: string; count: number };
type Metrics = { by_stage: StageCount[]; by_status: StatusCount[]; conversion_rate?: { won: number; lost: number; win_rate: number } };

export default function Dashboard() {
  const { t } = useI18n();
  const help = useHelp();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statBg = useColorModeValue("white","gray.800");
  const statBorder = useColorModeValue("gray.200","gray.700");
  const boxBg = useColorModeValue("white","gray.800");
  const boxBorder = useColorModeValue("gray.200","gray.700");
  const textMuted = useColorModeValue("gray.600","gray.300");

  useEffect(() => {
    getDealsMetrics().then(setMetrics).catch((e) => setError(String(e)));
  }, []);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">{t("pipeline_metrics")}</Heading>
        <Button size="sm" onClick={() => help.open("introducao")}>Ajuda</Button>
      </HStack>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      {metrics && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            {metrics.by_stage?.map((s) => (
              <Stat key={s.stage_id} bg={statBg} p={4} borderRadius="md" border="1px solid" borderColor={statBorder}>
                <StatLabel>{s.name}</StatLabel>
                <StatNumber>{s.count}</StatNumber>
              </Stat>
            ))}
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            {metrics.by_status?.map((s) => (
              <Stat key={s.status} bg={statBg} p={4} borderRadius="md" border="1px solid" borderColor={statBorder}>
                <StatLabel>{t("status")}: {s.status}</StatLabel>
                <StatNumber>{s.count}</StatNumber>
              </Stat>
            ))}
          </SimpleGrid>
          <Box bg={boxBg} p={4} borderRadius="md" border="1px solid" borderColor={boxBorder}>
            <Text>
              {t("conversion_rate")}:
              <b> {Number(((metrics.conversion_rate?.win_rate ?? 0) * 100).toFixed(2))}%</b>
            </Text>
            <Text color={textMuted}>{t("won")}: {metrics.conversion_rate?.won ?? 0} • {t("lost")}: {metrics.conversion_rate?.lost ?? 0}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
