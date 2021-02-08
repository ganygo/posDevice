module.exports=function(conn){
	var schema = mongoose.Schema({
		type:{type: String, default:'', enum:['global','user'],index:true},
		memberId: {type: mongoose.Schema.Types.ObjectId, ref: 'members', default: null,index:true},
		module:{type: String, default:'',index:true},
		name:{type: String, default:'',index:true},
		createdDate: { type: Date,default: Date.now, index:true },
		modifiedDate:{ type: Date,default: Date.now, index:true },
		programButtons:[{
			program:{type: mongoose.Schema.Types.ObjectId, ref: 'programs'},
			text: {type: String, default: ''},
			icon: {type :String, default:''},		
			class: {type :String, default:''},
			passive:{ type: Boolean, default:false }
		}],
		print:{
			form:{type: mongoose.Schema.Types.ObjectId, ref: 'print_designs', default: null},
			list:{type: mongoose.Schema.Types.ObjectId, ref: 'print_designs', default: null}
		},
		autoSave:{ type: Boolean, default:false }
	})

	schema.pre('save', function(next) {
		this.name=`${this.type}_${this.module}`
		next()
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
	// schema.plugin(mongooseAggregatePaginate)
	

	var collectionName='settings'
	var model=conn.model(collectionName, schema)
	
	model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb) }
	
	return model
}
