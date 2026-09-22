const API_URL = "https://script.google.com/macros/s/AKfycbzP3HxF0FUADvYwrNEvwZwIvffYak8CNIGxlMwWX44Evip52C6743PuRw6mS_MiVZ0v3Q/exec";

const form = document.getElementById("transactionForm");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const submitButton = document.getElementById("submitButton");

const hargaInput = document.getElementById("harga");
const persenInput = document.getElementById("persen");

const estimateCommission = document.getElementById("estimateCommission");
const estimateNote = document.getElementById("estimateNote");

const chartEmpty = document.getElementById("chartEmpty");
const toast = document.getElementById("toast");

let allData = [];
let chartKomisi = null;


// ======================================================
// FORMAT RUPIAH
// ======================================================

function formatRupiah(angka) {

    const value = Number(angka) || 0;

    return "Rp " + value.toLocaleString("id-ID");

}


// ======================================================
// FORMAT ANGKA
// ======================================================

function formatNumber(angka) {

    return (Number(angka) || 0).toLocaleString("id-ID");

}


// ======================================================
// FORMAT TANGGAL
// ======================================================

function formatTanggal(tanggal) {

    const t = parseApiDate(tanggal);

    if (!t || Number.isNaN(t.getTime())) {
        return "-";
    }

    return t.toLocaleDateString("id-ID", {

        day: "2-digit",
        month: "short",
        year: "numeric"

    });

}


// ======================================================
// PARSE TANGGAL
// ======================================================

function parseApiDate(value) {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    const raw = String(value);

    // Jika format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {

        const [y, m, d] = raw
            .split("-")
            .map(Number);

        return new Date(
            y,
            m - 1,
            d
        );

    }

    const d = new Date(raw);

    return Number.isNaN(d.getTime())
        ? null
        : d;

}


// ======================================================
// KEY TANGGAL
// ======================================================

function dateKey(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


// ======================================================
// TANGGAL HARI INI
// ======================================================

function getCurrentDateKey() {

    return dateKey(
        new Date()
    );

}


// ======================================================
// KEY BULAN
// ======================================================

function getMonthKey(date) {

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;

}


// ======================================================
// SET INFORMASI TANGGAL
// ======================================================

function setTodayUI() {

    const now = new Date();

    document.getElementById("tanggal").value =
        dateKey(now);

    document.getElementById("todayLabel").textContent =
        now.toLocaleDateString("id-ID", {

            weekday: "long",
            day: "numeric",
            month: "long"

        });

    document.getElementById("periodLabel").textContent =
        now.toLocaleDateString("id-ID", {

            month: "long",
            year: "numeric"

        });

}


// ======================================================
// ESTIMASI KOMISI
// ======================================================

function updateEstimate() {

    const harga =
        Number(hargaInput.value) || 0;

    const persen =
        Number(persenInput.value) || 0;

    const komisi =
        (harga * persen) / 100;

    estimateCommission.textContent =
        formatRupiah(komisi);

    estimateNote.textContent =
        harga && persen
            ? `${persen}% dari ${formatRupiah(harga)}`
            : "Isi harga dan persentase untuk melihat estimasi.";

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// ======================================================
// NOTIFIKASI
// ======================================================

function showToast(
    message,
    isError = false
) {

    toast.textContent = message;

    toast.style.background =
        isError
            ? "#b53c55"
            : "#292329";

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);

}


// ======================================================
// REKAP KOMISI PER KARYAWAN
// ======================================================

function getRecap(data) {

    const recap = {};

    data.forEach(item => {

        const nama =
            item.karyawan || "Tanpa Nama";

        recap[nama] =
            (recap[nama] || 0)
            + (Number(item.komisi) || 0);

    });

    return Object.entries(recap)

        .sort(
            (a, b) =>
                b[1] - a[1]
        );

}


// ======================================================
// RENDER TABEL KOMISI
// ======================================================

function renderSummary(data) {

    const body =
        document.getElementById("komisiBody");

    const recap =
        getRecap(data);

    const total =
        recap.reduce(
            (sum, [, value]) =>
                sum + value,
            0
        );

    body.innerHTML =
        recap.length

            ? recap.map(
                ([nama, value]) => {

                    const share =
                        total
                            ? (value / total) * 100
                            : 0;

                    return `
                    <tr>

                        <td>
                            ${escapeHtml(nama)}
                        </td>

                        <td>
                            ${formatRupiah(value)}
                        </td>

                        <td>
                            ${share.toFixed(1)}%
                        </td>

                    </tr>
                    `;

                }
            ).join("")

            : `
            <tr>

                <td
                    colspan="3"
                    style="
                        text-align:center;
                        color:#aa9ca5
                    "
                >
                    Belum ada data
                </td>

            </tr>
            `;

}


// ======================================================
// RENDER CHART
// ======================================================

function renderChart(data) {

    const recap =
        getRecap(data);

    const canvas =
        document.getElementById("komisiChart");


    // Hapus chart sebelumnya

    if (chartKomisi) {

        chartKomisi.destroy();

        chartKomisi = null;

    }


    // Jika belum ada data

    if (!recap.length) {

        chartEmpty.classList.add("show");

        return;

    }

    chartEmpty.classList.remove("show");


    chartKomisi =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels:
                    recap.map(
                        item => item[0]
                    ),

                datasets: [{

                    data:
                        recap.map(
                            item => item[1]
                        ),

                    backgroundColor: [

                        "#d85b92",
                        "#e892b5",
                        "#f4b8cf",
                        "#b77aa2",
                        "#e2c0d1",
                        "#ca6e9c",
                        "#a96f8d",
                        "#f0d5e1"

                    ],

                    borderWidth: 4,

                    borderColor:
                        "#ffffff"

                }]

            },

            options: {

                responsive: true,

                cutout: "62%",

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            boxWidth: 11,

                            usePointStyle: true,

                            pointStyle: "circle",

                            padding: 15,

                            font: {

                                size: 11

                            }

                        }

                    },

                    datalabels: {

                        color: "#fff",

                        font: {

                            weight: "700",

                            size: 11

                        },

                        formatter(
                            value,
                            context
                        ) {

                            const sum =
                                context.chart.data.datasets[0]
                                .data
                                .reduce(
                                    (a, b) =>
                                        a + b,
                                    0
                                );

                            if (!sum) {
                                return "";
                            }

                            const percentage =
                                (value / sum) * 100;

                            return percentage >= 5

                                ? `${percentage.toFixed(0)}%`

                                : "";

                        }

                    }

                }

            },

            plugins: [

                ChartDataLabels

            ]

        });

}


// ======================================================
// FILTER DATA
// ======================================================

function filterData() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!keyword) {

        return allData;

    }


    return allData.filter(item =>

        String(
            item.karyawan || ""
        )
            .toLowerCase()
            .includes(keyword)

        ||

        String(
            item.treatment || ""
        )
            .toLowerCase()
            .includes(keyword)

    );

}


// ======================================================
// RENDER RIWAYAT
// ======================================================

function renderHistory(data) {

    const filtered =
        filterData();


    document.getElementById(
        "resultCount"
    ).textContent =
        `${filtered.length.toLocaleString("id-ID")} transaksi`;


    tableBody.innerHTML =
        filtered.map(item => `

            <tr>

                <td>
                    ${formatTanggal(item.tanggal)}
                </td>

                <td>
                    ${escapeHtml(item.karyawan)}
                </td>

                <td>
                    ${escapeHtml(item.treatment)}
                </td>

                <td>
                    ${formatRupiah(item.harga)}
                </td>

                <td>
                    ${escapeHtml(item.persen)}%
                </td>

                <td>
                    ${formatRupiah(item.komisi)}
                </td>

            </tr>

        `).join("");


    document
        .getElementById("tableEmpty")
        .classList.toggle(
            "show",
            filtered.length === 0
        );

}


// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard(data) {

    const now = new Date();

    const today =
        getCurrentDateKey();

    const month =
        getMonthKey(now);


    let omzetHari = 0;

    let omzetBulan = 0;

    let totalKomisi = 0;

    let transaksiHariIni = 0;

    let transaksiBulanIni = 0;


    data.forEach(item => {

        const t =
            parseApiDate(item.tanggal);

        const harga =
            Number(item.harga) || 0;

        const komisi =
            Number(item.komisi) || 0;


        totalKomisi +=
            komisi;


        if (!t) {
            return;
        }


        // Hari ini

        if (
            dateKey(t) === today
        ) {

            omzetHari +=
                harga;

            transaksiHariIni +=
                1;

        }


        // Bulan ini

        if (
            getMonthKey(t) === month
        ) {

            omzetBulan +=
                harga;

            transaksiBulanIni +=
                1;

        }

    });


    document.getElementById(
        "todaySales"
    ).textContent =
        formatRupiah(
            omzetHari
        );


    document.getElementById(
        "monthSales"
    ).textContent =
        formatRupiah(
            omzetBulan
        );


    document.getElementById(
        "totalCommission"
    ).textContent =
        formatRupiah(
            totalKomisi
        );


    document.getElementById(
        "totalTransactions"
    ).textContent =
        formatNumber(
            data.length
        );


    document.getElementById(
        "todayHint"
    ).textContent =
        `${transaksiHariIni} transaksi hari ini`;


    document.getElementById(
        "monthHint"
    ).textContent =
        `${transaksiBulanIni} transaksi bulan ini`;

}


// ======================================================
// POPULATE DROPDOWN KARYAWAN
// ======================================================

function populateEmployees(list) {

    const select =
        document.getElementById(
            "karyawan"
        );


    select.innerHTML =
        '<option value="">Pilih Karyawan</option>';


    (list || []).forEach(item => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            item.nama;

        option.textContent =
            item.nama;

        select.appendChild(
            option
        );

    });

}


// ======================================================
// LOAD DATA
// ======================================================

async function loadData() {

    try {

        const response =
            await fetch(
                API_URL,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        allData =
            Array.isArray(
                result.transaksi
            )

                ? result.transaksi

                : [];


        populateEmployees(
            result.karyawan
        );


        updateDashboard(
            allData
        );


        renderSummary(
            allData
        );


        renderChart(
            allData
        );


        renderHistory(
            allData
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Data belum dapat dimuat. Cek koneksi atau Apps Script.",
            true
        );

    }

}


// ======================================================
// SUBMIT TRANSAKSI
// ======================================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const tanggal =
            document.getElementById(
                "tanggal"
            ).value;


        const nama =
            document.getElementById(
                "karyawan"
            ).value;


        const namaTreatment =
            document.getElementById(
                "treatment"
            ).value.trim();


        const nilaiHarga =
            Number(
                hargaInput.value
            );


        const nilaiPersen =
            Number(
                persenInput.value
            );


        const komisi =
            (nilaiHarga * nilaiPersen) / 100;


        // Validasi

        if (
            !tanggal
            ||
            !nama
            ||
            !namaTreatment
            ||
            !nilaiHarga
            ||
            !nilaiPersen
        ) {

            showToast(
                "Lengkapi data transaksi terlebih dahulu.",
                true
            );

            return;

        }


        const transaksi = {

            tanggal,

            karyawan:
                nama,

            treatment:
                namaTreatment,

            harga:
                nilaiHarga,

            persen:
                nilaiPersen,

            komisi:
                komisi

        };


        // Disable tombol

        submitButton.disabled =
            true;


        submitButton
            .querySelector(
                "span:first-child"
            )
            .textContent =
            "Menyimpan...";


        try {

            const response =
                await fetch(
                    API_URL,
                    {

                        method: "POST",

                        body:
                            JSON.stringify(
                                transaksi
                            )

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            await response.json();


            // Tampilkan hasil

            document.getElementById(
                "hasilNama"
            ).textContent =
                nama;


            document.getElementById(
                "hasilOmzet"
            ).textContent =
                formatRupiah(
                    nilaiHarga
                );


            document.getElementById(
                "hasilKomisi"
            ).textContent =
                formatRupiah(
                    komisi
                );


            // Reset form

            form.reset();


            document.getElementById(
                "tanggal"
            ).value =
                getCurrentDateKey();


            updateEstimate();


            // Load ulang data

            await loadData();


            // Notifikasi

            showToast(
                "Transaksi berhasil disimpan ✓"
            );


            // Scroll hasil

            document.getElementById(
                "hasil"
            ).scrollIntoView({

                behavior: "smooth",

                block: "center"

            });


        } catch (error) {

            console.error(
                error
            );


            showToast(
                "Transaksi gagal disimpan. Periksa koneksi atau Apps Script.",
                true
            );


        } finally {

            submitButton.disabled =
                false;


            submitButton
                .querySelector(
                    "span:first-child"
                )
                .textContent =
                "Simpan Transaksi";

        }

    }
);


// ======================================================
// UPDATE ESTIMASI SAAT INPUT BERUBAH
// ======================================================

[
    hargaInput,
    persenInput

].forEach(input => {

    input.addEventListener(
        "input",
        updateEstimate
    );

});


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    () => {

        renderHistory(
            allData
        );

    }
);


// ======================================================
// INISIALISASI
// ======================================================

setTodayUI();

updateEstimate();

loadData();
