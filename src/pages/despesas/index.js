import React, { useState, useEffect, useMemo } from "react";
import carregando from "../../assets/loading.gif";
import api from "../../services/api";
import Header from "../../Header";
import SideMenu from "../../SideMenu";
import Footer from "../../Footer";
import DataTable from "react-data-table-component";
import './despesas.css'
// import DataTableExtensions from "react-data-table-component-extensions";
import "react-data-table-component-extensions/dist/index.css";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function List_Despesas({ history }) {
  const [prod, setProd] = useState([]);
  const [exportExcel, setExportExcel] = useState([]);
  const [loading, setLoading] = useState("");
  const [msgvazio, setMsgvazio] = useState("carregando...");
  const [rowsSel, setRowsSel] = useState([]);
  const [selectedIDS, setselectedIDS] = useState([]);
  const [searchByName, setSearchByName] = useState(localStorage.getItem("searchByName") || "");
  const [startDate, setStartDate] = useState(localStorage.getItem("startDate") || "");
  const [endDate, setendDate] = useState(localStorage.getItem("endDate") || "");
  const [intervalWindow, setIntervalWindow] = useState(false);

  const url_string = window.location.href;
  const param = url_string.split("=");

  function efetivaBusca() {
    loadDespesas();
  }

  const CustomStatus = ({ row }) =>
    row.status == "0" ? (
      <span className="label label-info">Rascunho</span>
    ) : row.status == "1" ? (
      <span className="label label-warning">Aguardando Aprovação</span>
    ) : row.status == "2" ? (
      <span className="label label-success">Aprovado</span>
    ) : row.status == "3" ? (
      <span className="label label-danger">Reprovado</span>
    ) : (
      ""
    );

  const CustomValor = ({ row }) => <span>R${row.valor}</span>;

  const CustomDate = ({ row }) =>
    row.dataentrada.substring(8, 10) +
    "/" +
    row.dataentrada.substring(5, 7) +
    "/" +
    row.dataentrada.substring(0, 4);

    function formatDate(dateISO){
      const data = new Date(dateISO);

      // Obtém o dia, mês e ano
      const dia = String(data.getUTCDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0'); // Adiciona 1 ao mês e garante que tenha 2 dígitos
      const ano = data.getUTCFullYear();

      // Formata a data como uma string no formato dia/mês/ano
      const dataFormatada = `${dia}/${mes}/${ano}`;
      return dataFormatada
    }

  const CustomFoto = ({ row }) => (
    <a href={row.foto} target="_blank">
      <i className="fa fa-image" />
    </a>
  );

  const columns = [
    {
      name: "Requisição N.",
      selector: "numero",
      sortable: true,
    },
    {
      name: "Requisitante",
      selector: "nomerequester",
    },
    {
      name: "Criado em",
      selector: "dataentrada",
      cell: (row) => <CustomDate row={row} />,
    },
    {
      name: "Último Update",
      selector: "updatedAt",
      cell: (row) => formatDate(row.updatedAt),
    },
    {
      name: "Status",
      selector: "status",
      sortable: true,
      cell: (row) => <CustomStatus row={row} />,
    },
    {
      name: "Aprovador",
      selector: "nomeaprovador",
    },
  ];

  // const goToPage = (state) => {
  //   history.push('/checklistcomp/' + state._id);
  // };

  const goToPage = (state) => {
    history.push('/despesa/' + state._id);
  };

  async function loadProd() {
    //setLoading(true);
    const query = "/despesaItem/aggreg/export";
    const response = await api.get(query);
    const data = await response.data;
    setExportExcel(data);
    //setLoading(false);
  }

  function checkModalClose(e){
    if(e.target.className === "selectInterval"){
      setIntervalWindow(false)
    }
  }

  async function loadDespesas() {
    setLoading(true);

    let query = "/despesa";
    if (searchByName) {
      query = `/despesa?name=${searchByName}`;
    }
    if (startDate && endDate) {
      query = `/despesa?startDate=${startDate}&endDate=${endDate}`;
    }
    if (searchByName && startDate && endDate) {
      query = `/despesa?name=${searchByName}&startDate=${startDate}&endDate=${endDate}`;
    }

    // console.log(`${searchByName}, ${startDate}, ${endDate}`)
    // alert(query)

    const response = await api.get(query);
    const data = await response.data;
    setProd(data);
    setLoading(false);
  }

  function submitFilterForm(e){
    e.preventDefault();
    localStorage.setItem("searchByName", searchByName);
    localStorage.setItem("startDate", startDate);
    localStorage.setItem("endDate", endDate);
    loadDespesas();
  }

  function getCurrentDate(){
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear(); //Obtem o ano
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // Adiciona 1 para obter o mês correto e garante que tenha 2 dígitos
    const dia = String(dataAtual.getDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
    const dataFormatada = `${ano}-${mes}-${dia}`;
    return dataFormatada
  }

  async function intervalFilter(e){
    const value = e.target.value;

    if(value === "Em qualquer data"){
      setendDate(undefined)
      setStartDate(undefined)
    }
    
    if(value === "No último ano"){
      setendDate(getCurrentDate())

      const data = new Date(getCurrentDate())
      data.setFullYear(2023)
      const novaData = data.toISOString().split('T')[0];
      setStartDate(novaData)
    }

    if(value === "Nos últimos 6 meses"){
      setendDate(getCurrentDate())

      const data = new Date(getCurrentDate());
      data.setMonth(data.getMonth() - 6);
      const novaData = data.toISOString().split('T')[0];
      setStartDate(novaData)
    }

    if(value === "Intervalo personalizado"){
      setIntervalWindow(true)
    }
  }

  function submitInterval(e){
    e.preventDefault()
    setIntervalWindow(false)
    loadDespesas()
  }

  useEffect(() => {
    setLoading(true);
    //loadProd();
    loadDespesas();
    setMsgvazio("Nenhuma despesa encontrada");
    setTimeout(() => {
      if (document.getElementById("menu_desp_consulta")) {
        document.getElementById("menu_desp_consulta").className = "active";
      }
    }, 50);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  async function handleRemove(id, item) {
    if (rowsSel.length > 0) {
      if (window.confirm("Confirma remoção dos itens selecionados ?")) {
        setLoading(true);
        rowsSel.map(async (item) => {
          await api
            .delete("/despesa/" + item._id)
            .then((res) => {
              if (res.data.error != undefined) {
                alert(res.data.error);
                setLoading(false);
                return;
              } else {
                loadDespesas();
                setLoading(false);
              }
            })
            .catch((error) => {
              alert(error);
              setLoading(false);
              return;
            });
        });
      }
    } else {
      alert("Nenhum registro selecionado !");
    }
  }

  const handleChange = (state) => {
    setRowsSel(state.selectedRows);
    
    const AllItems = []
    if(state.selectedRows[0] !== undefined){
      state.selectedRows.map((item) => {
        AllItems.push(item._id)
      })
      setselectedIDS(AllItems);
    }
  };

  // const tableData = {
  //   columns,
  //   data: prod,
  // };

  const exportToExcel = async () => {
    setLoading(true);
    const query = "/despesaItem/aggreg/export";
    const response = await api.get(query);
    const data = await response.data;
    let arrClone = [];

    for(const index in data){
      if(data[index].iddespesa.length > 0){
        data[index].Numero = data[index].iddespesa[0].numero;
        data[index].Requisitante = data[index].iddespesa[0].nomerequester;
        data[index].Criado = data[index].iddespesa[0].dataentrada;
        data[index].Status = data[index].iddespesa[0].status == "0" ? "Rascunho" 
        : data[index].iddespesa[0].status == "1" ? "Aguardando Aprovação"
        : data[index].iddespesa[0].status == "2" ? "Aprovado"
        : data[index].iddespesa[0].status == "3" ? "Reprovado"
        :"";
        data[index].Aprovador = data[index].iddespesa[0].nomeaprovador;
        data[index].Tipo = data[index].categoriaText;
        data[index].Valor = data[index].valor;

        delete data[index].iddespesa;
        delete data[index].categoriaText;
        delete data[index].descr;
        delete data[index].valor;
        delete data[index].foto;
        delete data[index]._id;

        arrClone.push(data[index]);
      }
    }

    //console.log(arrClone)
    
    const worksheet = XLSX.utils.json_to_sheet(arrClone);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, "Despesas.xlsx");
    setLoading(false);
};

const exportToExcelSelected = async () => {
  if(selectedIDS.length === 0){
    alert("Nenhum item selecionado")
    return;
  }
  setLoading(true);
  const query = "/despesaItem/aggreg/export/selectedByID";
  const requestBody = {
    selectedItems: selectedIDS
  };
  const response = await api.post(query, requestBody);
  const data = await response.data;
  let arrClone = [];

  if(data){
    data.map((item) => {
      arrClone.push({
        Aprovador: item.iddespesa.nomeaprovador,
        Criado: item.iddespesa.createdAt,
        Numero: item.iddespesa.numero,
        Requisitante: item.iddespesa.nomerequester,
        Status: item.iddespesa.status == 0 ? "Rascunho" 
        : item.iddespesa.status == "1" ? "Aguardando Aprovação"
        : item.iddespesa.status == "2" ? "Aprovado"
        : item.iddespesa.status == "3" ? "Reprovado"
        :"",
        Tipo: item.categoriaText,
        Valor: item.valor
      })
    })
  }

  //console.log(arrClone)
  
  const worksheet = XLSX.utils.json_to_sheet(arrClone);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, "Despesas.xlsx");
  setLoading(false);
};

  return (
    <>
      <Header />
      <SideMenu />

      <div>
        <div className="content-wrapper">
          <section className="content-header">
            <h1>Despesas</h1>
          </section>

          <section className="content">
            <div className="row">
              <div className="col-xs-12">
                <div className="box box-primary">
                  {loading && (
                    <div style={{ alignItems: "center", textAlign: "center" }}>
                      <img src={carregando} width="80"></img>
                    </div>
                  )}

                  <div className="col-md-12 nopadding">
                    <div className="col-md-6 nopadding">
                      <button
                        type="button"
                        className="btn btn-danger btn-flat margin"
                        onClick={() => {
                          handleRemove("", "");
                        }}
                      >
                        Remover Selecionados
                      </button>
                      <button
                        type="button"
                        className="btn btn-info btn-flat margin"
                        onClick={() => {
                          exportToExcelSelected();
                        }}
                      >
                        Exportar Selecionados
                      </button>
                      <button
                        style={{backgroundColor: "#44b678"}}
                        type="button"
                        className="btn btn-info btn-flat margin"
                        onClick={() => {
                          exportToExcel();
                        }}
                      >
                        Exportar Tudo
                      </button>
                    </div>

                    <form  onSubmit={(e) => (submitFilterForm(e))} className="despesasFilter">
                    <input type="text" placeholder="Buscar requisitante" id="searchByName" value={searchByName} onChange={(e) => setSearchByName(e.target.value)}/>
                    <select defaultValue="opcao1" onChange={(e) => (intervalFilter(e))}>
                      <option value="opcao1">Em qualquer data</option>
                      <option>Nos últimos 6 meses</option>
                      <option>No último ano</option>
                      <option>Intervalo personalizado</option>
                    </select>
                    <button type="submit" className="btn btn-info btn-flat margin" >Aplicar</button>
                  </form>
                  
                  </div>

                  

                  <div className="selectInterval" style={intervalWindow ? {display: "block"} : {display: "none"}} onClick={(e) => {checkModalClose(e)}}>
                        <form className="contentInterval" onSubmit={(e) => (submitInterval(e))}>
                          <div className="closeSelector" onClick={() => (setIntervalWindow(false))}><p>X</p></div>
                          <h3>Intervalo Personalizado</h3>
                          <div className="dateSelector">
                            <p>Data inicial</p>
                            <input type="date" placeholder="Data inicial" required onChange={(e) => {setStartDate(e.target.value)}}></input>
                          </div>
                          <div className="dateSelector">
                            <p>Data Final</p>
                            <input type="date" placeholder="Data inicial" required onChange={(e) => {setendDate(e.target.value)}}></input>
                          </div>
                          <button type="submit" className="intervalBtn">Aplicar</button>
                        </form>
                  </div>

                  {/* <DataTableExtensions
                    {...tableData}
                    filterPlaceholder={"Buscar"}
                    exportHeaders={false}
                    print={false}
                  > */}
                    <DataTable
                      columns={columns}
                      data={prod}
                      onRowClicked={goToPage}
                      selectableRows
                      pointerOnHover
                      highlightOnHover
                      onSelectedRowsChange={handleChange}
                      noDataComponent={""}
                    />
                  {/* </DataTableExtensions> */}
                </div>
              </div>
            </div>
          </section>
          {/* /.content */}
        </div>
      </div>

      <Footer />
    </>
  );
}


//nome,
//descr,
//preco,
//imagem,
//promocao,
//idestabelecimento
