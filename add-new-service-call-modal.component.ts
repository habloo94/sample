import { Component, TemplateRef, OnInit, ViewChild, Input, SimpleChanges } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgForm, FormControl, FormGroup, Validators, FormArray, FormBuilder } from '@angular/forms';
import { BsLocaleService } from 'ngx-bootstrap';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { esLocale } from 'ngx-bootstrap/locale';
import { ApiService } from 'src/app/data/api.service';
import { AfterSalesService } from '../../after-sales-service.service';
import jwt_decode from 'jwt-decode';
import { IUserData, ICustomerData,IRegion,IAhupart, ITrouble } from 'src/app/constants/dataStruct';
import { el } from 'date-fns/locale';

@Component({
  selector: 'app-add-new-service-call-modal',
  templateUrl: './add-new-service-call-modal.component.html',
  styleUrls: ['./add-new-service-call-modal.component.scss']
})
export class AddNewServiceCallModalComponent implements OnInit {
  regions: IRegion[];
  customers: ICustomerData;
  currentUser: IUserData;
  salesErData: IUserData[];
  ahuPart: IAhupart[];
  troubleList: ITrouble[];
  fltr_troubleList: ITrouble[];
  modalRef: BsModalRef;
  salesErLoggedin: boolean;
  regDate = new Date().toISOString();
  serviceCallForm: FormGroup;
  config = {
    backdrop: true,
    ignoreBackdropClick: true,
    class: 'modal-right'
  };
  customerForm: FormGroup;
  troubleForm: FormGroup;
  @Input() fieldEntries = null;

  @ViewChild('template', { static: true }) template: TemplateRef<any>;
  isAddCustomer: boolean;
  constructor(private modalService: BsModalService, private apiService: ApiService, private afterSalesService: AfterSalesService, private formBuilder: FormBuilder,) {
    defineLocale('es', esLocale);
  }


  ngOnChanges(changes: SimpleChanges) {

    for (let property in changes) {
      if (property == 'fieldEntries') {
        if (this.fieldEntries !== null) {
          this.serviceCallForm.patchValue({
            jobRef: this.fieldEntries.jobRef,
            soNum: this.fieldEntries.soNum,
            mcTag: this.fieldEntries.mcTag,
            mcSerialNum: this.fieldEntries.mcSerialNum,
            customerId: this.fieldEntries.customerId,
            projectName: this.fieldEntries.projectName,
            invoiceNum: this.fieldEntries.invoiceNum,
            salesEr: this.fieldEntries.salesEr,
            troubles: this.fieldEntries.troubles
          });
          console.log(this.fieldEntries, 'Fields');

        } else this.resetFormFields();
      }
    }
  }

  ngOnInit(): void {

    this.isAddCustomer = false;
    console.log(this.fieldEntries);
    const token = localStorage.getItem("currentUser1");
    const date = new Date(0);
    const decoded = jwt_decode(token);
    this.currentUser = decoded['userData'];
    console.log(this.currentUser);

    

    

    this.serviceCallForm = this.formBuilder.group({
      jobRef: new FormControl(null, [Validators.required]),
      // regDate: new FormControl(null, [Validators.required]),
      soNum: new FormControl(null, [Validators.required]),
      mcTag: new FormControl(null, [Validators.required]),
      mcSerialNum: new FormControl(null, [Validators.required]),
      customerId: new FormControl(null, [Validators.required]),
      projectName: new FormControl(null, [Validators.required]),
      invoiceNum: new FormControl(null, [Validators.required]),
      salesEr: new FormControl(null, [Validators.required]),
      troubles: this.formBuilder.array([this.newTrouble()])
    });

    this.customerForm = new FormGroup({
      customerName: new FormControl(null, [Validators.required]),
      region : new FormControl(null, [Validators.required]),
      salesEr : new FormControl(null, [Validators.required]),
    });

    

    this.loadCustomerData();
    this.loadUserData();
    this.loadRegionList();
    this.loadOptions();
    
    if (this.currentUser.department == 1) {
      if (this.currentUser.designation == 6 || this.currentUser.designation == 7) {
        this.salesErLoggedin = true
      } else { this.salesErLoggedin = false }
    }
  }
  troubles() : FormArray {
    
    return this.serviceCallForm.get('troubles') as FormArray
    
  }

  newTrouble(): FormGroup {
    return this.formBuilder.group({
      ahuPart: new FormControl(null, [Validators.required]),
      trouble : new FormControl(null, [Validators.required]),
      note : new FormControl(null),
    })
  }

  addTroubleFormGroupClick(): void{
    this.troubles().push(this.newTrouble());
  }

  removeTroubleFormGroupClick(i: number): void {
    this.troubles().removeAt(i);
  }

  change_ahuPart(val,i){
    console.log(i);
    console.log(this.troubles().controls);
    
    this.fltr_troubleList = this.troubleList.filter(i => (i.partId == val))
  }

  loadUserData() {
    this.apiService.getUsers().subscribe( data => {
      var saleTeam = data['data'].filter(i => (i.department == 1));
      this.salesErData = saleTeam.filter(i => (i.designation == 6 || i.designation == 5));   
    })
  }

  loadCustomerData() {
    this.apiService.getCustomer().subscribe(
      data => {
        var initialData = data['data'];
        // this.customers = data['data'];
        // console.log(initialData);
        // var sortedData = initialData.filter(i => (i.address[0].salesEr))
        let filteredData
if(this.currentUser.department == 1){
  if(this.currentUser.designation == 6 || this.currentUser.designation == 5)
  {console.log('i am junior / senior');
  filteredData = initialData.filter(_ => _.address.find(_ => _.salesEr == this.currentUser.id));
}
  else{console.log('i am NOT junior / senior');filteredData = initialData}
}        
        // console.log(filteredData);
        this.customers = filteredData;
      }
    );
  };

  loadRegionList(){
    this.apiService.getRegion().subscribe(
      data => {
        var initialData = data['data'];
        // console.log(initialData);
        
        let sortedData = [];
        
        if(this.currentUser.designation == 1){
          this.regions = initialData;
          // console.log('HHH');
          
        }else{
          var regionIDs = [...((this.currentUser.region).split(','))]
        // console.log(regionIDs[0]);    
        for (let index = 0; index < regionIDs.length; index++) {
          var data = initialData.find(
            (item) => item.id == regionIDs[index]
          )
          sortedData.push(data)
        };
        this.regions = sortedData;}
        console.log(this.regions);
        
      }
    )
  }

  loadOptions(){
    this.apiService.getOptions().subscribe(
      data => {
        console.log(data);
        
        this.ahuPart = data['ahuPart']
        this.troubleList = data['troubleList']
        console.log(this.ahuPart);
        
      }
    )
  }

  show() {
    this.modalRef = this.modalService.show(this.template, this.config);
  }

  hide() {
    this.modalRef.hide();
  }

  resetFormFields() {
    this.serviceCallForm.patchValue({
      jobRef: null,
      soNum: null,
      mcTag: null,
      mcSerialNum: null,
      customerId: null,
      projectName: null,
      invoiceNum: null,
      salesEr: null
    });

  };

  resetCustomerFormFields() {
    this.customerForm.patchValue({
      customerName: null
    });
  };

  onAddCustomer() {
    this.isAddCustomer = true;
  }

  onSubmitserviceCallForm() {
    
    console.log('Button Works1')
    if (this.salesErLoggedin == true) {this.serviceCallForm.value.salesEr = this.currentUser.id;}
    // if (this.serviceCallForm.invalid) {
    //   return false;
    // }
    var data = {
      "jobRef": this.serviceCallForm.value.jobRef,
      "regDate": this.regDate,
      "soNum": this.serviceCallForm.value.soNum,
      "mcTag": this.serviceCallForm.value.mcTag,
      "mcSerialNum": this.serviceCallForm.value.mcSerialNum,
      "customerId": this.serviceCallForm.value.customerId,
      "projectName": this.serviceCallForm.value.projectName,
      "invoiceNum": this.serviceCallForm.value.invoiceNum,
      "salesEr":this.serviceCallForm.value.salesEr,
      "createdby": this.currentUser.id,
      "trouble":this.serviceCallForm.value.troubles,
      "status": 1,
    }
    console.log(data, "Form submitted");
    this.apiService.setServiceCalls(data).subscribe(res => {
      this.resetFormFields();
      ;
      
    }, error => { }, () => {
      this.hide();
      
      this.afterSalesService.updateTableData.next(true);
    });
  }

  onSubmitCustomerForm() {
    
    
    if (this.salesErLoggedin == true) {this.customerForm.value.salesEr = this.currentUser.id;}
    // if (this.customerForm.invalid) {
    //   return false;
    // }

    

    console.log('Button Works2');
    var data = {
      'name': this.customerForm.value.customerName,
      'createdDate': new Date().toISOString(),
      'createdby' : this.currentUser.id,
      'address': {salesEr : this.customerForm.value.salesEr, region: this.customerForm.value.region}
    }
    console.log(data);
    
    this.apiService.setCustomer(data).subscribe(res => {
      this.resetCustomerFormFields();
      var lastEntry = res['last_customer_added'][0].id
      this.serviceCallForm.value.customerId = lastEntry;
      console.log(this.serviceCallForm.value.customerId);
      
    }, error => { }, () => {
      this.isAddCustomer = false;
      this.loadCustomerData();
    });

  }


}
