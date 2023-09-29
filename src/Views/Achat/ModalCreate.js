import React, { useEffect, useState, useCallback, useMemo } from "react";

import {
  Col,
  Row,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  ModalFooter,
  FormFeedback,
  ListGroupItem,
  ListGroup,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import SimpleBar from "simplebar-react";
import Dropzone from "react-dropzone";
import DropFileComponents from "./DropFileComponent";

const ModalCreate = ({
  validation,
  modal,
  toggle,
  setModal,
  setIsEdit,
  isEdit,
  setAchat,
  achat,
  transactions,
  createAchats,
  setFilesSelected,
  filesSelected,
  collaborateurs,
  transFilter, 
  setTransFilter
}) => {

  function isSelected(id){
    let obj = transFilter?.data?.find((item) => item.tba_id === id );
    if(obj){
      if((obj.old===1 && obj.type!="disoc") || (obj.old===0 && obj.type=="assoc")){
        return true;
      }
    }
   
    return false
  }
  const handleSearchChange = (e) => {
    const { value } = e.target;
    setTransFilter({ ...transFilter, searchTerm: value });
  };
  const filterData = (arrayTrans) => {
    return arrayTrans?.data?.filter((item) => {
      // Définissez ici les propriétés sur lesquelles vous souhaitez effectuer la recherche
      const searchFields = [
        item?.tba_amount,
        item.tba_rp,
        item.tba_bkg_date,
        item.tba_ref,
      ];
      return searchFields.some((field) =>
        field?.toLowerCase()?.includes(arrayTrans?.searchTerm?.toLowerCase())
      );
    });
  };

  const filteredData = filterData(transFilter);
  const handleTransaction = (tra) => {
    let newArrayselected = [...transFilter?.data];
    newArrayselected = newArrayselected.map((item,i) => {
      // item.key=i;
      if (item.tba_id === tra?.tba_id) {
      
        if(tra.old === 1 && tra.type=="disoc"){
          return {
            ...item,
            ["type"]: null, 
          };
        }else if(tra.old === 1 && tra.type!="disoc"){
          return {
            ...item,
            ["type"]: "disoc", 
          };
        }else if(tra.old === 0 && tra.type==null){
          return {
            ...item,
            ["type"]: "assoc", 
          };
        }else if(tra.old === 0 && tra.type=="assoc"){
          return {
            ...item,
            ["type"]: null, 
          };
        }
      } else {
        return item;
      }
    });
    setTransFilter({ ...transFilter, data: newArrayselected });
  };

  const typesAchat = [
    {
      value: "Charge",
      label: "Charge",
    },
    {
      value: "Revenu",
      label: "Revenu",
    },
  ];


  
  useEffect(() => {
    if(transactions){
      setTransFilter({
        data: transactions || [],
        searchTerm: "",
      })
    }

  }, [transactions])
  
  return (
    <Modal id="showModal" isOpen={modal} toggle={toggle} centered>
      <ModalHeader className="bg-soft-info p-3" toggle={toggle}>
        {!!isEdit
          ? "Modifier le détail de l'achat"
          : "Ajouter une/plusieurs factures d'achat"}
      </ModalHeader>

      <Form
        className="tablelist-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isEdit) {
            createAchats.handleSubmit();
          } else {
            validation.handleSubmit();
          }
          return false;
        }}
      >
        <ModalBody>
          <Input type="hidden" id="id-field" />
          {!isEdit && (
            <Row className="g-3">
              <Col lg={12}>
                <div>
                  <Label htmlFor="type-field" className="form-label">
                    Type
                  </Label>

                  <Input
                    type="select"
                    className="form-select mb-0"
                    validate={{
                      required: { value: true },
                    }}
                    invalid={
                      createAchats.touched.type && createAchats.errors.type
                        ? true
                        : false
                    }
                    value={createAchats.values.type}
                    onChange={createAchats.handleChange}
                    onBlur={createAchats.handleBlur}
                    name="type"
                    id="type-field"
                  >
                    <option disabled={true} value={""}>
                      Choisir un type
                    </option>
                    {typesAchat.map((e, i) => (
                      <option key={i} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </Input>
                  {createAchats.touched.type && createAchats.errors.type ? (
                    <FormFeedback type="invalid">
                      {createAchats.errors.type}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={12}>
                <DropFileComponents
                  setValues={setFilesSelected}
                  values={filesSelected}
                  touched={createAchats.touched.files}
                  errors={createAchats.errors.files}

                />
              </Col>
            </Row>
          )}
          {isEdit && (
            <Row className="g-3">
              <Col lg={6}>
                <div>
                  <Label htmlFor="montant-field" className="form-label">
                    Montant Total (TVA inclus)
                  </Label>
                  <Input
                    name="montant"
                    id="montant-field"
                    className="form-control"
                    placeholder="Entrer le montant total"
                    type="number"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.montant || ""}
                    invalid={
                      validation.touched.montant && validation.errors.montant
                        ? true
                        : false
                    }
                  />
                  {validation.touched.montant && validation.errors.montant ? (
                    <FormFeedback type="invalid">
                      {validation.errors.montant}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={6}>
                <div>
                  <Label htmlFor="tva-field" className="form-label">
                    Total TVA
                  </Label>
                  <Input
                    name="tva"
                    id="tva-field"
                    className="form-control"
                    placeholder="Entrer le total TVA"
                    type="number"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.tva || ""}
                    invalid={
                      validation.touched.tva && validation.errors.tva
                        ? true
                        : false
                    }
                  />
                  {validation.touched.tva && validation.errors.tva ? (
                    <FormFeedback type="invalid">
                      {validation.errors.tva}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>

              <Col lg={6}>
                <div>
                  <Label htmlFor="libelle-field" className="form-label">
                    Libellé
                  </Label>
                  <Input
                    name="libelle"
                    id="libelle-field"
                    className="form-control"
                    placeholder="Entrer un libellé"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.libelle || ""}
                    invalid={
                      validation.touched.libelle && validation.errors.libelle
                        ? true
                        : false
                    }
                  />
                  {validation.touched.libelle && validation.errors.libelle ? (
                    <FormFeedback type="invalid">
                      {validation.errors.libelle}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={6}>
                <div>
                  <Label htmlFor="categorie-field" className="form-label">
                    Catégorie
                  </Label>
                  <Input
                    name="categorie"
                    id="categorie-field"
                    className="form-control"
                    placeholder="Entrer une catégorie"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.categorie || ""}
                    invalid={
                      validation.touched.categorie &&
                      validation.errors.categorie
                        ? true
                        : false
                    }
                  />
                  {validation.touched.categorie &&
                  validation.errors.categorie ? (
                    <FormFeedback type="invalid">
                      {validation.errors.categorie}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={6}>
                <div>
                  <Label htmlFor="dateAchat-field" className="form-label">
                    Date d'achat
                  </Label>
                  <Input
                    name="dateAchat"
                    id="dateAchat-field"
                    className="form-control"
                    placeholder="Entrer une méthode"
                    type="date"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.dateAchat || ""}
                    invalid={
                      validation.touched.dateAchat && validation.errors.dateAchat
                        ? true
                        : false
                    }
                  />
                  {validation.touched.dateAchat && validation.errors.dateAchat ? (
                    <FormFeedback type="invalid">
                      {validation.errors.dateAchat}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={6}>
                <div>
                  <Label htmlFor="dateEcheance-field" className="form-label">
                    Date d'échéance
                  </Label>
                  <Input
                    name="dateEcheance"
                    id="dateEcheance-field"
                    className="form-control"
                    placeholder="Entrer une catégorie"
                    type="date"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.dateEcheance || ""}
                    invalid={
                      validation.touched.dateEcheance &&
                      validation.errors.dateEcheance
                        ? true
                        : false
                    }
                  />
                  {validation.touched.dateEcheance &&
                  validation.errors.dateEcheance ? (
                    <FormFeedback type="invalid">
                      {validation.errors.dateEcheance}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>

              <Col lg={6}>
                <div>
                  <Label htmlFor="numero-field" className="form-label">
                    Numéro d'achat
                  </Label>
                  <Input
                    name="numero"
                    id="numero-field"
                    className="form-control"
                    placeholder="Entrer un numéro"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.numero || ""}
                    invalid={
                      validation.touched.numero && validation.errors.numero
                        ? true
                        : false
                    }
                  />
                  {validation.touched.numero && validation.errors.numero ? (
                    <FormFeedback type="invalid">
                      {validation.errors.numero}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={6}>
                <div>
                  <Label htmlFor="methode-field" className="form-label">
                    Méthode
                  </Label>
                  <Input
                    name="methode"
                    id="methode-field"
                    className="form-control"
                    placeholder="Entrer une méthode"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.methode || ""}
                    invalid={
                      validation.touched.methode && validation.errors.methode
                        ? true
                        : false
                    }
                  />
                  {validation.touched.methode && validation.errors.methode ? (
                    <FormFeedback type="invalid">
                      {validation.errors.methode}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={12}>
              <div>
                  <Label htmlFor="entity-field" className="form-label">
                    Client/Fournisseur
                  </Label>

                  <Input
                    type="select"
                    className="form-select mb-0"
                    invalid={
                      validation.touched.entity && validation.errors.entity
                        ? true
                        : false
                    }
                    value={validation.values.entity}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    name="entity"
                    id="entity-field"
                  >
                    <option  disabled={false} value={""}>
                      Choisissez client/fournisseur
                    </option>
                    {collaborateurs.map((e, i) => (
                      <option key={i} value={e.ent_id}>
                        {e.ent_name}
                      </option>
                    ))}
                  </Input>
                  {validation.touched.entity && validation.errors.entity ? (
                    <FormFeedback type="invalid">
                      {validation.errors.entity}
                    </FormFeedback>
                  ) : null}
                </div>
              </Col>
              <Col lg={12}>
                <div>
                  <p className="text-muted">
                    Associer une/plusieurs transaction(s) à l'achat
                  </p>
                  <div id="users">
                    <Row className="mb-2">
                      <Col lg={12}>
                        <div>
                          <input
                            className="search form-control"
                            placeholder="Chercher une transaction"
                            value={transFilter.searchTerm}
                            onChange={handleSearchChange}
                          />
                        </div>
                      </Col>
                    </Row>

                    <SimpleBar style={{ height: "150px" }} className="mx-n3">
                      <ListGroup className="list mb-0" flush>
                        {filteredData?.map((tra,i) => {
                          return (
                            <ListGroupItem
                              key={i}
                              className={` ${
                                isSelected(tra.tba_id)
                                  ? "bg-light text-grey tit"
                                  : ""
                              }`}
                              onClick={() => {
                                handleTransaction(tra);
                              }}
                              data-id="1"
                            >
                              <div className={`d-flex`}>
                                <div className="flex-grow-1">
                                  <h5 className="fs-13 mb-1 text-dark">
                                    {isSelected(tra.tba_id) ? (
                                      <i className="las la-link"></i>
                                    ) : null}
                                    {tra.tba_ref}
                                  </h5>
                                  <p
                                    className="born timestamp text-muted mb-0"
                                    data-timestamp="12345"
                                  >
                                    {tra.tba_bkg_date}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <div>€ {tra.tba_amount}</div>
                                </div>
                              </div>
                            </ListGroupItem>
                          );
                        })}
                      </ListGroup>
                    </SimpleBar>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="hstack gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                setModal(false);
                setIsEdit(false);
                setAchat({});
              }}
            >
              {" "}
              Fermer{" "}
            </button>
            <button type="submit" className="btn btn-success" id="add-btn">
              {" "}
              {!!isEdit ? "Modifier" : "Ajouter"}{" "}
            </button>
          </div>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ModalCreate;