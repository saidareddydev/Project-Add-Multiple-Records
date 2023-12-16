import { LightningElement,wire,track,api } from 'lwc';
import CONTACT_OBJECT from "@salesforce/schema/Contact";
import GENDER_IDENITY_FIELD from "@salesforce/schema/contact.GenderIdentity";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import saveMultipleContacts from "@salesforce/apex/AddMultipleContactHandler.saveMultipleContacts";
import { CloseActionScreenEvent } from "lightning/actions";
export default class AddMultipleRecords extends LightningElement {
    @api recordId;
    @track contacts = [];
    isLoading = false;
    @wire(getObjectInfo,{
        objectApiName : CONTACT_OBJECT
    }) contactobjectinfo;
    @wire(getPicklistValues,{
        recordTypeId : '$contactobjectinfo.data.defaultRecordTypeId',
        fieldApiName:GENDER_IDENITY_FIELD})
         genderpicklistvalues;
    get getGenderpicklistvalues(){
        return this.genderpicklistvalues?.data?.values;
    }
    connectedCallback(){
        this.addNewClickHandler();
    }
    addNewClickHandler(event){
        this.contacts.push({
            tempId: Date.now()
        })
    }
    deleteClickHandler(event){
        if(this.contacts.length == 1){
            this.showToast('You Cannot Delete Last Contact Record');
            return;
        }
        let tempId = event.target?.dataset.tempId;
        this.contacts = this.contacts.filter(a=>a.tempId != tempId);
    }
    elementChangeHandler(event){
        
        let contactRow = this.contacts.find(a=>a.tempId == event.target.dataset.tempId);
        if(contactRow){
            contactRow[event.target.name] = event.target?.value; 
        }
    }
    async submitClickHandler(event){
        const allvalied = this.checkControlsValidity();
        if(allvalied){
            this.isLoading = true;
            this.contacts.forEach(a=>a.AccountId=this.recordId);
            let response = await saveMultipleContacts({contacts : this.contacts});
            if(response.isSuccess){
                this.showToast('Contacts Saved Successfully....','Success','success');
                this.dispatchEvent(new CloseActionScreenEvent());
            } else{
                this.showToast('Somthing Went to Worng While Saveing Contacts-'+response.message);
            }
            this.isLoading = false;

        } else
        {
            this.showToast('Please Correct Below Errors to Procced Further');
        }

    }
    checkControlsValidity(){
        let isValid = true,
        controls = this.template.querySelectorAll('lightning-input,lightning-combobox');
        controls.forEach(field =>{
            if(!field.checkValidity()){
                field.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }
    showToast(message,title='Error',variant='error') {
        const event = new ShowToastEvent({
            title,
            message,
            variant
            
        });
        this.dispatchEvent(event);
    }
}