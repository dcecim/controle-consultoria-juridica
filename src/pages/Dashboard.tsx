import { useEffect, useState } from "react";
import { SimpleGrid, Stat, StatLabel, StatNumber, Box, Heading, Text } from "@chakra-ui/react";
import { getDealsMetrics } from "../lib/api";
import { useI18n } from "../useI18n";

type StageCount = { stage_id: number; name: string; count: number };
type StatusCount = { status: string; count: number };
type Metrics = { by_stage: StageCount[]; by_status: StatusCount[]; conversion_rate?: { won: number; lost: number; win_rate: number } };

export default function Dashboard() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDealsMetrics().then(setMetrics).catch((e) => setError(String(e)));
  }, []);

  return (
    <Box>
      <Heading size="md" mb={4}>{t("pipeline_metrics")}</Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      {metrics && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            {metrics.by_stage?.map((s) => (
              <Stat key={s.stage_id} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <StatLabel>{s.name}</StatLabel>
                <StatNumber>{s.count}</StatNumber>
              </Stat>
            ))}
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            {metrics.by_status?.map((s) => (
              <Stat key={s.status} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <StatLabel>{t("status")}: {s.status}</StatLabel>
                <StatNumber>{s.count}</StatNumber>
              </Stat>
            ))}
          </SimpleGrid>
          <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
            <Text>
              {t("conversion_rate")}:
              <b> {Number(((metrics.conversion_rate?.win_rate ?? 0) * 100).toFixed(2))}%</b>
            </Text>
            <Text color="gray.600">{t("won")}: {metrics.conversion_rate?.won ?? 0} • {t("lost")}: {metrics.conversion_rate?.lost ?? 0}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
