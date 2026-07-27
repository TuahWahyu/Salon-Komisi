//==============================
// MASTER DATA TREATMENT
//==============================
const API_URL="https://script.google.com/macros/s/AKfycbzP3HxF0FUADvYwrNEvwZwIvffYak8CNIGxlMwWX44Evip52C6743PuRw6mS_MiVZ0v3Q/exec";

//==============================

const treatment = document.getElementById("treatment");

const harga = document.getElementById("harga");

const persen = document.getElementById("persen");

const form = document.getElementById("transactionForm");

const tableBody = document.getElementById("tableBody");

//==============================

let omzetHari = 0;

let omzetBulan = 0;

let totalKomisi = 0;

//==============================

//==============================

form.addEventListener("submit",function(e){

e.preventDefault();

const tanggal=document.getElementById("tanggal").value;

const nama=document.getElementById("karyawan").value;

const namaTreatment=treatment.value;

const nilaiHarga=parseInt(harga.value);

const nilaiPersen=parseFloat(persen.value);

const komisi=(nilaiHarga*nilaiPersen)/100;

const transaksi={

tanggal:tanggal,

karyawan:nama,

treatment:namaTreatment,

harga:nilaiHarga,

persen:nilaiPersen,

komisi:komisi

};

//==============================

document.getElementById("hasilNama").innerHTML=nama;

document.getElementById("hasilOmzet").innerHTML=formatRupiah(nilaiHarga);

document.getElementById("hasilKomisi").innerHTML=formatRupiah(komisi);

//==============================



//==============================

document.getElementById("todaySales").innerHTML=formatRupiah(omzetHari);

document.getElementById("monthSales").innerHTML=formatRupiah(omzetBulan);

document.getElementById("totalCommission").innerHTML=formatRupiah(totalKomisi);

//==============================

const row=`

<tr>

<td>${tanggal}</td>

<td>${nama}</td>

<td>${namaTreatment}</td>

<td>${formatRupiah(nilaiHarga)}</td>

<td>${nilaiPersen}%</td>

<td>${formatRupiah(komisi)}</td>

</tr>

`;


fetch(API_URL,{

method:"POST",

body:JSON.stringify(transaksi)

})
.then(res=>res.json())
.then(data=>{

    form.reset();

    document.getElementById("tanggal").valueAsDate = new Date();

    loadData();

    showToast();

});

});

//==============================

function formatRupiah(angka){

return "Rp "+angka.toLocaleString("id-ID");

}

function formatTanggal(tanggal){

    const t = new Date(tanggal);

    return t.toLocaleString("id-ID",{
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
    });

}

function renderKomisiPerKaryawan(data){

    const komisiBody = document.getElementById("komisiBody");

    komisiBody.innerHTML = "";

    const rekap = {};

    data.forEach(item=>{

        if(!rekap[item.karyawan]){

            rekap[item.karyawan]=0;

        }

        rekap[item.karyawan]+=item.komisi;

    });

    Object.keys(rekap).forEach(nama=>{

        komisiBody.innerHTML+=`

        <tr>

            <td>${nama}</td>

            <td>${formatRupiah(rekap[nama])}</td>

        </tr>

        `;

    });

}

function showToast(){

    const toast = document.getElementById("toast");

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2000);

}

async function loadData(){

    try{

        const response = await fetch(API_URL);

        const result = await response.json();

        const data = result.transaksi;

        const selectKaryawan = document.getElementById("karyawan");

selectKaryawan.innerHTML =
'<option value="">Pilih Karyawan</option>';

result.karyawan.forEach(item=>{

    selectKaryawan.innerHTML +=
    `<option value="${item.nama}">
        ${item.nama}
    </option>`;

});

        tableBody.innerHTML = "";

        omzetHari = 0;
        omzetBulan = 0;
        totalKomisi = 0;

        data.forEach(item=>{

            const hariIni = new Date();

const tanggalTransaksi = new Date(item.tanggal);

if (
    tanggalTransaksi.toDateString() ===
    hariIni.toDateString()
){

    omzetHari += item.harga;

}

if (

    tanggalTransaksi.getMonth() === hariIni.getMonth()

    &&

    tanggalTransaksi.getFullYear() === hariIni.getFullYear()

){

    omzetBulan += item.harga;

}

totalKomisi += item.komisi;

            tableBody.innerHTML += `
                <tr>
                    <td>${formatTanggal(item.tanggal)}</td>
                    <td>${item.karyawan}</td>
                    <td>${item.treatment}</td>
                    <td>${formatRupiah(item.harga)}</td>
                    <td>${item.persen}%</td>
                    <td>${formatRupiah(item.komisi)}</td>
                </tr>
            `;
        });

       document.getElementById("todaySales").innerHTML =
    formatRupiah(omzetHari);

document.getElementById("monthSales").innerHTML =
    formatRupiah(omzetBulan);

document.getElementById("totalCommission").innerHTML =
    formatRupiah(totalKomisi);

renderKomisiPerKaryawan(data);

}catch(error){

    console.error(error);

}

}

window.onload = function(){

    document.getElementById("tanggal").valueAsDate = new Date();

    loadData();

};
