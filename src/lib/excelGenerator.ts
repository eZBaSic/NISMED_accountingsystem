import * as XLSX from "xlsx";

export type IndividualReport = {
  payee_name: string;
  date: string;
  gross: number;
  taxed_amount: number;
  net_amount: number;
};

export function exportExcel(individual: IndividualReport[]) {
    const grouped: Record<string, IndividualReport[]> = {};

    for (const v of individual) {
    const date = v.date;

    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(v);
    }

    const dates = Object.keys(grouped);

    const headerRow = [
    "Payee Name",
    ...dates,
    "Gross Total",
    "Net Total"
    ];

    const payees = [...new Set(individual.map(v => v.payee_name))];

    const rows: (string | number)[][] = payees.map(name => {
        const row: (string | number)[] = [name];

        let total = 0;

        for (const date of dates) {
            const entry =
                grouped[date].find(
                    v => v.payee_name === name
                );

            const gross =
                entry?.gross ?? 0;

            row.push(gross);

            total += gross;
        }
        let net = 0;
        net = total*0.9;
        
        row.push(total);
        row.push(net)

        return row;
    });

    const sheetData = [
    headerRow,
    ...rows
    ];

    console.log(sheetData);
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const maxLengths = sheetData[0].map((_, colIndex) =>
    Math.max(
        ...sheetData.map(row =>
        String(row[colIndex] ?? "").length
        )
    )
    );

    ws["!cols"] = maxLengths.map(len => ({
    wch: len + 2 // padding
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(wb, "TaxReport.xlsx");
}