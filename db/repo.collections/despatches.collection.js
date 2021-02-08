module.exports=function(conn){
    var schema = mongoose.Schema({
        ioType :{ type: Number,default: 0, index:true}, // 0 - cikis , 1- giris
        eIntegrator: {type: mongoose.Schema.Types.ObjectId, ref: 'integrators', required: true},
        // location: {type: mongoose.Schema.Types.ObjectId, ref: 'locations', required: [true, 'Lokasyon gereklidir']},
        location: {type: mongoose.Schema.Types.ObjectId, ref: 'locations'},
        subLocation: {type: mongoose.Schema.Types.ObjectId, ref: 'sub_locations'},
        // location2: {type: mongoose.Schema.Types.ObjectId, ref: 'locations', required: [true, 'Lokasyon 2 gereklidir']},
        location2: {type: mongoose.Schema.Types.ObjectId, ref: 'locations'},
        subLocation2: {type: mongoose.Schema.Types.ObjectId, ref: 'sub_locations'},
        profileId: { 
            value: { type: String,default: '', trim:true, enum:['TEMELIRSALIYE'], required: true}
        },
        ID: dbType.idType,
        uuid: dbType.valueType,
        issueDate: {value :{ type: String,  required: [true,'Irsaliye tarihi gereklidir']}},
        issueTime: {value :{ type: String,default: '00:00:00',minlength:[8,'Saat degeri en az 10 karakter uzunlugunda olmalidir.']}},
        despatchAdviceTypeCode: {value: { type: String,default: '', trim:true, enum:['SEVK','MATBUDAN'], required: true}},
        despatchPeriod: dbType.periodType,
        note:[dbType.valueType],
        additionalDocumentReference:[], //dbType.documentReferenceType
        orderReference:[], //dbType.orderReferenceType
        originatorDocumentReference:[], //dbType.documentReferenceType
        despatchSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        deliveryCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        originatorCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        sellerSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        buyerCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        shipment:dbType.shipmentType,
        lineCountNumeric:dbType.numberValueType,
        despatchLine:[], // dbType.despatchLineType
        receiptAdvice: {type: mongoose.Schema.Types.ObjectId, ref: 'despatches_receipt_advice'},
        localDocumentId: {type: String, default: ''},
        
        despatchStatus: {type: String, default: 'Draft',enum:['Deleted','Pending','Draft','Canceled','Queued', 'Processing','SentToGib','Approved','PartialApproved','Declined','WaitingForApprovement','Error']},
        despatchErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        localStatus: {type: String, default: '',enum:['','transferring','pending','transferred','error']},
        localErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    })

    

    schema.pre('save', function(next) {
        if(this.despatchLine){
            this.lineCountNumeric.value=this.despatchLine.length
        }
        
        updateActions(conn,this,next)
       
        //next()
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'))
        
    })
    schema.pre('remove', function(next) {
        next()
    })

    schema.pre('remove', true, function(next, done) {
        next()
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'))
    })

    schema.on('init', function(model) {

    })
    

    schema.plugin(mongoosePaginate)
    schema.plugin(mongooseAggregatePaginate)
    
    schema.index({
        "ioType":1,
        "ID.value":1,
        "issueDate.value":1,
        "uuid.value":1,
        "eIntegrator":1,
        "profileId.value":1,
        "despatchAdviceTypeCode.value":1,
        "localDocumentId":1,
        "despatchStatus":1,
        "localStatus":1,
        "createdDate":1
    })

    var collectionName='despatches'
    var model=conn.model(collectionName, schema)
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb) }
    
    return model
}


function updateActions(conn,doc,next){
    
    var index=0
    function kaydet(cb){
        if(index>=doc.despatchLine.length) return cb(null)
        if(doc.despatchLine[index].item._id){
            var newActionDoc=conn.model('actions')(dbType.actionType)
            newActionDoc.actionType='despatch'
            newActionDoc.ioType=doc.ioType
            newActionDoc.actionCode=doc.despatchAdviceTypeCode.value
            newActionDoc.issueDate=doc.issueDate.value
            newActionDoc.issueTime=doc.issueTime.value
            newActionDoc.docId=doc._id
            newActionDoc.docNo=doc.ID.value
            newActionDoc.inventory.locationId=doc.location
            newActionDoc.inventory.locationId2=doc.location
            newActionDoc.inventory.itemId=doc.despatchLine[index].item._id
            newActionDoc.inventory.quantity=doc.despatchLine[index].deliveredQuantity.value
            newActionDoc.description=''
            newActionDoc.modifiedDate=new Date()
            
            newActionDoc.save((err,newActionDoc2)=>{
                if(!err){
                    index++
                    setTimeout(kaydet,0,cb)
                }else{
                   cb(err)
                }
            })
             
        }else{
            index++
            setTimeout(kaydet,0,cb)
        }
        
    }
    
    conn.model('actions').deleteMany({docId:doc._id},(err,docs)=>{
        if(err){
            
            errorLog(err)
            next(err)
        }else{
            kaydet((err)=>{
               if(err){
                   errorLog(err)
                  
                   next(err) 
               }else{
                   
                   next()
               }
            })
        }
        
    })
}
