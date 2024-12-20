import React, { useEffect, useState } from "react";
import { CardBody, Row, Col, Card, Table, CardHeader, Container, Input, FormFeedback, Form } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getCompany as onGetCompany } from "../../slices/thunks";

import { customFormatNumber, rounded } from "../../utils/function";
import ConfirmModal from "../../Components/Common/ConfirmModal";
import DeleteModal from "../../Components/Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import SimpleBar from "simplebar-react";
import axios from "axios";
import { getImage } from "../../utils/getImages";
import FeatherIcon from "feather-icons-react/build/FeatherIcon";
import { invoiceEtatColor } from "../../common/data/invoiceList";
import { getEtatInvoice, getInvoiceById, updateInvoice } from "../../services/invoice";
import { addNewTransaction, deleteTransaction, getTransactionList, sendInvocieByEmail } from "../../services/transaction";

// const axios = new APIClient();

const InvoiceDetails = ({ route }) => {
  document.title = "Détail facture | Countano";

  let { id } = useParams();

  const { company, devise } = useSelector((state) => ({
    company: state?.Company?.company,
    devise: state.Company.devise
  }));

  const [invoice, setInvoice] = useState(null);
  const [etat, setEtat] = useState(null);
  // const [transactions, setTransactions] = useState(null);

  const [addActifView, setAddActifView] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // const [nbTransaction, setNbTransaction] = useState(transactions.length);
  const [image, setImage] = useState("");

  const [activeChange, setActiveChange] = useState(false);
  const [selectedEtat, setSelectedEtat] = useState(false);
  const [valueSubject, setValueSubject] = useState("");
  const [subjectChange, setSubjectChange] = useState(false);

  const dispatch = useDispatch();

  //Print the Invoice
  const printInvoice = () => {
    window.print();
  };

  const downloadPdf = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/v1/pdf/download/facture/${invoice?.header.fen_id}`, {
        mode: "no-cors",
        responseType: "blob"
      })
      .then((response) => {
        try {
          let elm = document.createElement("a"); // CREATE A LINK ELEMENT IN DOM
          elm.href = URL.createObjectURL(response); // SET LINK ELEMENTS CONTENTS
          elm.setAttribute("download", invoice?.header.fen_num_fac + ".pdf"); // SET ELEMENT CREATED 'ATTRIBUTE' TO DOWNLOAD, FILENAME PARAM AUTOMATICALLY
          elm.click(); // TRIGGER ELEMENT TO DOWNLOAD
          elm.remove();
        } catch (err) {
          console.log(err);
        }
      });
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      tra_com_fk: (invoice && invoice.header.fen_com_fk) || "",
      tra_fen_fk: (invoice && invoice.header.fen_id) || 0,
      tra_ent_fk: (invoice && invoice.header.fen_ent_fk) || 0,
      tra_value: (invoice && invoice.header.fen_solde_du) || 0,
      tra_date: moment().format("YYYY-MM-DD"),
      tra_desc: ""
    },
    validationSchema: Yup.object({
      tra_value: Yup.number().required("Champs obligatoire"),
      tra_date: Yup.string().required("Champs obligatoire")
    }),
    onSubmit: (values) => {
      if (invoice.header.fen_solde_du > 0) {
        addNewTransaction(values).then((res) => {
          setAddActifView(false);
          values.tra_id = res.tra_id;

          let newTransactionData = [...invoice.transactions, values];

          let soldeDuUpdated = rounded(
            newTransactionData.reduce((previousValue, currentValue) => parseFloat(previousValue) - parseFloat(currentValue.tra_value), parseFloat(invoice.header.fen_total_ttc)),
            2
          );

          updateInvoice({ fen_id: invoice.header.fen_id, fen_solde_du: soldeDuUpdated, fen_etat: soldeDuUpdated <= 0 ? "1" : invoice.header.fen_etat /* Permet de passer la facture en payé */ });

          setInvoice({
            ...invoice,
            header: {
              ...invoice.header,
              fen_solde_du: soldeDuUpdated
            },
            transactions: newTransactionData
          });
        });
      }
      validation.resetForm();
    }
  });

  const sendInvoiceByEmail = () => {
    sendInvocieByEmail(id);
    setShowConfirmModal(false);
  };

  /**
   * Supprimer une transation
   */
  const deletetransactionFunc = () => {
    deleteTransaction(selectedId).then((deletedId) => {
      let newTransactionData = invoice.transactions.filter((tra) => tra.tra_id != deletedId);

      let soldeDuUpdated = rounded(
        newTransactionData.reduce((previousValue, currentValue) => parseFloat(previousValue) - parseFloat(currentValue.tra_value), parseFloat(invoice.header.fen_total_ttc)),
        2
      );

      updateInvoice({ fen_id: invoice.header.fen_id, fen_solde_du: soldeDuUpdated, fen_etat: soldeDuUpdated > 0 ? (moment().isAfter(moment(invoice.header.fen_date_expired)) ? "2" : "5") : invoice.header.fen_etat /* Permet de passer la facture en payé */ });

      setInvoice({
        ...invoice,
        header: {
          ...invoice.header,
          fen_solde_du: soldeDuUpdated
        },
        transactions: newTransactionData
      });
    });
    setShowModalDelete(false);
  };

  /**
   * Supprime toutes les transactions ou ajout en fonction de si on la passe en payé ou impayé
   * @param {*} e
   */
  const toggleTransaction = (e) => {
    if (e.target.value == 1) {
      // si la facture est payé on ajoute la transaction
      validation.handleSubmit();
    } else {
      // si non on supprime LES transactions
      for (let index = 0; index < invoice.transactions.length; index++) {
        const element = invoice.transactions[index];
        deleteTransaction(element.tra_id);
      }
    }
  };

  useEffect(() => {
    dispatch(onGetCompany());
  }, []);

  useEffect(() => {
    if (company[0] && company[0].com_logo) {
      let path = (company[0].com_id + "/" + company[0].com_logo).replaceAll("/", " ");
      getImage(path).then((response) => {
        setImage("data:image/png;base64," + response);
      });
    }
  }, [company]);

  useEffect(() => {
    if (invoice && etat) {
    }
  }, [invoice, etat]);

  useEffect(() => {
    getInvoiceById(id).then((response) => {
      setInvoice(response);
      setValueSubject(response?.header.fen_sujet);
      getEtatInvoice().then((etatData) => {
        setSelectedEtat(etatData?.find((d) => d.fet_id == response?.header.fen_etat)?.fet_name);
        setEtat(etatData);
      });
    });
  }, []);

  if (!invoice) {
    return null;
  }
  console.log(invoice.transactions);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb
          className="d-print-none"
          title="Facture détaillée"
          pageTitle="Factures"
        />
        <ConfirmModal
          title={"Êtes-vous sûr ?"}
          text={"Êtes-vous sûr de vouloir envoyer la facture ?"}
          show={showConfirmModal}
          onCloseClick={() => setShowConfirmModal(false)}
          onActionClick={() => sendInvoiceByEmail()}
        />
        <DeleteModal
          show={showModalDelete}
          onCloseClick={() => setShowModalDelete(false)}
          onDeleteClick={() => deletetransactionFunc()}
        />
        <Row className="justify-content-center">
          <Col xxl={9}>
            {/* <Preview id={'jsx-template'}> */}
            <Card id="demo">
              <Row>
                <Col lg={12}>
                  <CardHeader className="border-bottom border-bottom-dashed">
                    <div>
                      <Row>
                        <Col
                          lg={8}
                          className="flex-grow-1 d-flex">
                          {image && (
                            <img
                              src={image}
                              className="card-logo card-logo-dark"
                              alt="logo dark"
                              width="260"
                            />
                          )}
                        </Col>
                        <Col
                          lg={4}
                          className="flex-shrink-0 mt-lg-0 mt-3">
                          <h6>
                            <span className="text-muted fw-normal">Email : </span>
                            <span id="email">{invoice.contact.fco_email}</span>
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">Téléphone : </span>
                            {invoice.contact.fco_phone}
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">Adresse : </span>
                            <span id="email">
                              {invoice.contact.fco_address}, {invoice.contact.fco_city}
                            </span>
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">Code postal : </span>
                            {invoice.contact.fco_cp}
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">Compte Bancaire : </span>
                            {invoice.header.fen_num_bank}
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">Numéro TVA : </span>
                            {invoice.header.fen_num_tva}
                          </h6>
                        </Col>
                      </Row>
                    </div>
                  </CardHeader>
                </Col>
                <Col lg={12}>
                  <CardBody className="p-4 border-bottom border-bottom-dashed">
                    <Row className="g-3">
                      <Col
                        xs={12}
                        md={6}
                        lg={4}
                        className="col-6 d-flex flex-column">
                        {!subjectChange ? (
                          <h6 className="text-muted text-uppercase fw-semibold mb-3">
                            {valueSubject}
                            <FeatherIcon
                              onClick={() => {
                                setSubjectChange(() => !subjectChange);
                              }}
                              className={"d-print-none mx-2 cursor-pointer"}
                              size={13}
                              icon={"edit-2"}></FeatherIcon>
                          </h6>
                        ) : (
                          <div class="input-group">
                            <input
                              placeholder="Sujet"
                              type="text"
                              defaultValue={invoice.header.fen_sujet}
                              class="form-control form-control"
                            />
                            <button
                              onClick={(e) => {
                                if (e.target?.previousSibling?.value?.trim()?.length > 0) {
                                  updateInvoice({
                                    fen_id: invoice.header.fen_id,
                                    fen_sujet: e.target.previousSibling.value
                                  });
                                  setValueSubject(e.target.previousSibling.value);
                                  setSubjectChange(() => false);
                                } else {
                                  toast.error("Veuillez entrer un sujet", {
                                    autoClose: 3000
                                  });
                                }
                              }}
                              class="btn btn-primary"
                              type="button">
                              Valider
                            </button>
                          </div>
                        )}
                      </Col>
                      <Col
                        xs={12}
                        md={6}
                        lg={8}
                        className="col-6 d-flex flex-column align-items-end">
                        <h6 className="text-muted text-uppercase fw-semibold mb-3">Information Client</h6>
                        <p
                          className="fw-medium mb-2"
                          id="billing-name">
                          {invoice.contact?.fco_cus_name}
                        </p>
                        <p
                          className="text-muted mb-1"
                          id="billing-address-line-1">
                          {invoice.contact.fco_cus_address}
                        </p>
                        <p
                          className="text-muted mb-1"
                          id="billing-address-line-1">
                          {invoice.contact.fco_cus_cp}, {invoice.contact.fco_cus_city}
                        </p>
                        <p className="text-muted mb-1">
                          <span>Téléphone: </span>
                          <span id="billing-phone-no">{invoice.contact.fco_cus_phone}</span>
                        </p>
                        <p className="text-muted mb-0">
                          <span>Email: </span>
                          <span id="billing-tax-no">{invoice.contact.fco_cus_email}</span>{" "}
                        </p>
                      </Col>
                    </Row>
                  </CardBody>
                </Col>
                <Col lg={12}>
                  <CardBody className="border-bottom border-bottom-dashed p-4">
                    <Row className="g-3">
                      <Col
                        lg={2}
                        className="col-6">
                        <p className="text-muted mb-2 text-uppercase fw-semibold">Facture N°</p>
                        <h5 className="fs-14 mb-0">
                          <span id="invoice-no">{invoice.header.fen_num_fac}</span>
                        </h5>
                      </Col>
                      <Col
                        lg={2}
                        className="col-6">
                        <p className="text-muted mb-2 text-uppercase fw-semibold">Date de création</p>
                        <h5 className="fs-14 mb-0">
                          <span id="invoice-date">{moment(invoice.header.fen_date_create).format("L")}</span>{" "}
                          <small
                            className="text-muted"
                            id="invoice-time"></small>
                        </h5>
                      </Col>
                      <Col
                        lg={2}
                        className="col-6">
                        <p className="text-muted mb-2 text-uppercase fw-semibold">Date d'échéance</p>
                        <h5 className="fs-14 mb-0">
                          <span id="invoice-date">{moment(invoice.header.fen_date_expired).format("L")}</span>{" "}
                          <small
                            className="text-muted"
                            id="invoice-time"></small>
                        </h5>
                      </Col>
                      <Col
                        lg={3}
                        className="col-6">
                        <p className="text-muted mb-2 text-uppercase fw-semibold">
                          état paiement
                          <FeatherIcon
                            onClick={() => {
                              setActiveChange(() => !activeChange);
                            }}
                            className={"d-print-none mx-2 cursor-pointer"}
                            size={13}
                            icon={"edit-2"}></FeatherIcon>
                        </p>
                        {activeChange ? (
                          <select
                            defaultValue={invoice.header.fen_etat}
                            onChange={(e) => {
                              toggleTransaction(e);
                              setSelectedEtat(etat?.find((d) => d.fet_id == e.target.value)?.fet_name);
                              setActiveChange(() => false);
                              updateInvoice({
                                fen_id: invoice.header.fen_id,
                                fen_etat: e.target.value,
                                fen_solde_du: invoice.header.fen_total_ttc
                              });
                              setInvoice({
                                ...invoice,
                                header: {
                                  ...invoice.header,
                                  fen_etat: e.target.value,
                                  fen_solde_du: invoice.header.fen_total_ttc
                                },
                                transactions: []
                              });
                            }}
                            className="form-select">
                            {etat.map((e) => {
                              return <option value={e.fet_id}>{e.fet_name}</option>;
                            })}
                          </select>
                        ) : (
                          <span
                            className={"badge fs-11 badge-soft-" + invoiceEtatColor[invoice.header.fen_etat - 1]}
                            id="payment-status">
                            {selectedEtat}
                          </span>
                        )}
                      </Col>
                      <Col
                        lg={3}
                        className="col-6">
                        <p className="text-muted mb-2 text-uppercase fw-semibold">Total</p>
                        <h5 className="fs-14 mb-0">
                          <span id="total-amount">{customFormatNumber(invoice.header.fen_total_ttc)}</span>
                          {devise}
                        </h5>
                      </Col>
                    </Row>
                  </CardBody>
                </Col>

                <Col lg={12}>
                  <CardBody className="p-4">
                    <div className="table-responsive">
                      <Table className="table-borderless text-center table-nowrap align-middle mb-0">
                        <thead>
                          <tr className="table-active">
                            <th
                              scope="col"
                              style={{ width: "50px" }}>
                              #
                            </th>
                            <th scope="col">Détails produit</th>
                            <th
                              scope="col"
                              className="text-end">
                              Quantité
                            </th>
                            <th
                              scope="col"
                              className="text-end">
                              Prix unitaire HT
                            </th>
                            <th
                              scope="col"
                              className="text-end">
                              Remise %
                            </th>
                            <th
                              scope="col"
                              className="text-end">
                              Tva %
                            </th>
                            <th
                              scope="col"
                              className="text-end">
                              Total TTC
                            </th>
                          </tr>
                        </thead>
                        <tbody id="products-list">
                          {invoice?.ligne?.map((ligne, i) => (
                            <tr key={i}>
                              <th scope="row">{i + 1}</th>
                              <td className="text-center">
                                <span className="fw-medium">{ligne.fli_name}</span>
                                <p className="text-muted mb-0">{ligne.fli_detail}</p>
                              </td>
                              <td className="text-end">{ligne.fli_qty}</td>
                              <td className="text-end">
                                {customFormatNumber(ligne.fli_unit_ht)}
                                {devise}
                              </td>
                              <td className="text-end">{ligne.fli_pourcent_remise}%</td>
                              <td className="text-end">{ligne.fli_tva}%</td>
                              <td className="text-end">
                                {customFormatNumber(ligne.fli_total_ttc)}
                                {devise}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <div className="border-top border-top-dashed mt-2">
                      <Table
                        className="pagebreak table-borderless table-nowrap align-middle mb-0 ms-auto"
                        style={{ width: "250px" }}>
                        <tbody>
                          <tr>
                            <td>Sous total HT</td>
                            <td className="text-end">
                              {customFormatNumber(invoice.header.fen_total_ht)}
                              {devise}
                            </td>
                          </tr>
                          <tr>
                            <td>Total remise</td>
                            <td className="text-end">
                              - {customFormatNumber(invoice.header.fen_total_remise)}
                              {devise}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              Total TVA <small className="text-muted"></small>
                            </td>
                            <td className="text-end">
                              {customFormatNumber(invoice.header.fen_total_tva)}
                              {devise}
                            </td>
                          </tr>
                          {/* <tr>
                            <td></td>
                            <td className="text-end">{}</td>
                          </tr> */}
                          <tr className="border-top border-top-dashed fs-15">
                            <th scope="row">Total TTC</th>
                            <th className="text-end">
                              {customFormatNumber(invoice.header.fen_total_ttc)}
                              {devise}
                            </th>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                    <div className="border-top border-top-dashed mt-2  table-responsive">
                      <SimpleBar autoHide={false}>
                        <Table className="pagebreak table-borderless table-nowrap align-middle mb-0 ms-auto mt-3">
                          <thead>
                            <tr className="table-active">
                              <th scope="col">Transaction</th>
                              <th scope="col">Date</th>
                              <th scope="col">Description</th>
                              <th
                                scope="col"
                                className="text-end">
                                Montant
                              </th>
                              <th className="text-end">
                                <button
                                  disabled={invoice?.header.fen_etat == 1 ? true : false}
                                  onClick={() => setAddActifView(() => true)}
                                  className="d-print-none btn btn-secondary btn-icon "
                                  style={{ width: "25px", height: "25px" }}>
                                  +
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="border-bottom border-bottom-dashed fs-15">
                            {invoice.transactions.length > 0 &&
                              invoice.transactions.map((element, index) => {
                                return (
                                  <tr key={index + 1}>
                                    <td>#{index + 1}</td>

                                    <td>{moment(element.tra_date).format("L")}</td>
                                    <td>{element.tra_desc}</td>
                                    <td className="text-end">
                                      {customFormatNumber(element.tra_value)}
                                      {devise}
                                    </td>
                                    <td width={40}>
                                      <button
                                        disabled={invoice?.header.fen_etat == 1 ? true : false}
                                        onClick={() => {
                                          setShowModalDelete(() => true);
                                          setSelectedId(element.tra_id);
                                        }}
                                        className="btn btn-danger btn-icon"
                                        style={{
                                          width: "25px",
                                          height: "25px"
                                        }}>
                                        <div
                                          style={{
                                            position: "absolute",
                                            transform: "rotate(45deg)"
                                          }}>
                                          +
                                        </div>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </Table>

                        {invoice.transactions.length > 0 && (
                          <Table
                            className="pagebreak table-borderless table-nowrap align-middle mb-4 ms-auto"
                            style={{ width: "250px" }}>
                            <tbody>
                              <tr>
                                <td>Solde</td>
                                <td className="text-end">
                                  {customFormatNumber(invoice.header.fen_solde_du)}
                                  {devise}
                                </td>
                                <td width={40}></td>
                              </tr>
                            </tbody>
                          </Table>
                        )}

                        {!invoice.transactions.length && !addActifView && (
                          <Col className="mt-4 mb-4 text-center">
                            <i>Aucune Transaction</i>
                          </Col>
                        )}

                        {addActifView ? (
                          <Form
                            className="d-print-none "
                            onSubmit={(e) => {
                              e.preventDefault();
                              validation.handleSubmit();
                              return false;
                            }}>
                            <Row className="my-4 mx-0 p-0 ">
                              <Col lg={3}>
                                <Input
                                  type="date"
                                  className="form-control border-1 mb-2"
                                  id="fco_name"
                                  name="tra_date"
                                  value={validation.values.tra_date || ""}
                                  onBlur={validation.handleBlur}
                                  onChange={validation.handleChange}
                                  invalid={validation.errors?.tra_date && validation.touched?.tra_date ? true : false}
                                />
                                {validation.errors?.tra_date && validation.touched?.tra_date ? <FormFeedback type="invalid">{validation.errors?.tra_date}</FormFeedback> : null}
                              </Col>
                              <Col lg={3}>
                                <Input
                                  type="text"
                                  className="form-control border-1 mb-2"
                                  id="fco_name"
                                  name="tra_desc"
                                  value={validation.values.tra_desc || ""}
                                  onBlur={validation.handleBlur}
                                  onChange={validation.handleChange}
                                  placeholder="Description"
                                  invalid={validation.errors?.tra_desc && validation.touched?.tra_desc ? true : false}
                                />
                                {validation.errors?.tra_desc && validation.touched?.tra_desc ? <FormFeedback type="invalid">{validation.errors?.tra_desc}</FormFeedback> : null}
                              </Col>
                              <Col lg={2}>
                                <Input
                                  type="number"
                                  className="form-control border-1 mb-2"
                                  id="tra_value"
                                  name="tra_value"
                                  value={validation.values.tra_value || ""}
                                  onBlur={validation.handleBlur}
                                  onChange={validation.handleChange}
                                  placeholder="Montant"
                                  invalid={validation.errors?.tra_value && validation.touched?.tra_value ? true : false}
                                />
                                {validation.errors?.tra_value && validation.touched?.tra_value ? <FormFeedback type="invalid">{validation.errors?.tra_value}</FormFeedback> : null}
                              </Col>
                              <Col
                                lg={4}
                                className="d-flex">
                                <div className="w-50 pr-1">
                                  <button
                                    type="submit"
                                    className=" px-2 btn btn-secondary w-100">
                                    Enregistrer
                                  </button>
                                </div>
                                <div className="w-50 ps-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAddActifView(() => false);
                                    }}
                                    className="btn btn-danger w-100">
                                    Annuler
                                  </button>
                                </div>
                              </Col>
                            </Row>
                          </Form>
                        ) : (
                          ""
                        )}
                      </SimpleBar>
                    </div>

                    <div className="hstack gap-2 justify-content-end d-print-none mt-4">
                      <button
                        to="#"
                        onClick={printInvoice}
                        className="btn btn-success">
                        <i className="ri-printer-line align-bottom me-1"></i> Imprimer
                      </button>
                      <button
                        onClick={() => setShowConfirmModal(true)}
                        className="btn btn-success">
                        <i className="ri-send-plane-fill align-bottom me-1"></i> Envoyer
                      </button>
                      <button
                        onClick={() => downloadPdf()}
                        className="btn btn-secondary">
                        <i className="ri-download-2-line align-bottom me-1"></i> Télécharger
                      </button>
                    </div>
                  </CardBody>
                </Col>
              </Row>
            </Card>
            {/* </Preview> */}
            {/* <div id="my-container" class="ng-scope pdfobject-container">
              <iframe id="test_preview" src={""} type="application/pdf" width="100%" height="100%"></iframe>
          </div> */}
          </Col>
        </Row>
        <ToastContainer
          closeButton={false}
          limit={1}
        />
      </Container>
    </div>
  );
};

export default InvoiceDetails;
