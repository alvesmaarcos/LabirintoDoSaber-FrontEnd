import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const CATEGORY_LABELS = {
  reading: 'Leitura',
  writing: 'Escrita',
  vocabulary: 'Vocabulário',
  comprehension: 'Compreensão',
};

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function pct(acc) {
  return `${Math.round((acc ?? 0) * 100)}%`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    backgroundColor: '#ffffff',
    fontSize: 11,
    color: '#333333',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: 2,
    borderColor: '#63E9E2',
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 10,
    color: '#666666',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#1a1a1a',
    marginTop: 18,
    marginBottom: 10,
  },
  overallBox: {
    backgroundColor: '#E8F9F8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  overallPct: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    color: '#008D85',
  },
  overallSub: {
    fontSize: 10,
    color: '#555555',
    marginTop: 3,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottom: 1,
    borderColor: '#eeeeee',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 11,
    color: '#444444',
  },
  categoryCount: {
    width: 90,
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  categoryPct: {
    width: 60,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#008D85',
    textAlign: 'right',
  },
  observationBlock: {
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  observationName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#333333',
    marginBottom: 2,
  },
  observationDate: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 5,
  },
  observationText: {
    fontSize: 10,
    color: '#555555',
    fontFamily: 'Helvetica-Oblique',
  },
  noData: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Helvetica-Oblique',
  },
});

function ReportPDF({ student, analysisData, sessions, includeMetrics, includeObservations }) {
  const categories = analysisData?.categories ?? {};
  const total = analysisData?.total ?? { total: 0, correct: 0, accuracy: 0 };
  const sessionsWithObs = (sessions ?? []).filter(s => s.observation);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Labirinto do Saber — Relatório de Desempenho</Text>
          <Text style={styles.headerMeta}>
            Aluno: {student?.name}  |  Idade: {student?.age} anos  |  Gerado em: {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {includeMetrics && (
          <View>
            <Text style={styles.sectionTitle}>Métricas de Desempenho</Text>
            <View style={styles.overallBox}>
              <Text style={styles.overallPct}>{pct(total.accuracy)}</Text>
              <Text style={styles.overallSub}>
                {total.correct} acertos de {total.total} questões respondidas
              </Text>
            </View>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const cat = categories[key];
              if (!cat) return null;
              return (
                <View key={key} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{label}</Text>
                  <Text style={styles.categoryCount}>{cat.correct}/{cat.total} questões</Text>
                  <Text style={styles.categoryPct}>{pct(cat.accuracy)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {includeObservations && (
          <View>
            <Text style={styles.sectionTitle}>Observações das Sessões</Text>
            {sessionsWithObs.length === 0 ? (
              <Text style={styles.noData}>
                Nenhuma observação registrada nas sessões incluídas.
              </Text>
            ) : (
              sessionsWithObs.map(session => (
                <View key={session.id} style={styles.observationBlock}>
                  <Text style={styles.observationName}>{session.name}</Text>
                  <Text style={styles.observationDate}>{formatDate(session.startedAt)}</Text>
                  <Text style={styles.observationText}>"{session.observation}"</Text>
                </View>
              ))
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

export default ReportPDF;
